import { cryptoManager } from 'snjs';
import template from '%/directives/password-wizard.pug';

export class PasswordWizard {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      type: '='
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  /* @ngInject */
  controller($scope, modelManager, archiveManager, authManager, syncManager, $timeout, alertManager) {

    window.onbeforeunload = (e) => {
      // Confirms with user to close tab before closing
      return true;
    };

    $scope.$on("$destroy", function() {
      window.onbeforeunload = null;
    });

    $scope.dismiss = function() {
      if($scope.lockContinue) {
        alertManager.alert({text: "Cannot close window until pending tasks are complete."});
        return;
      }
      $scope.el.remove();
      $scope.$destroy();
    }

    $scope.syncStatus = syncManager.syncStatus;
    $scope.formData = {};

    const IntroStep = 0;
    const BackupStep = 1;
    const SignoutStep = 2;
    const PasswordStep = 3;
    const SyncStep = 4;
    const FinishStep = 5;

    let DefaultContinueTitle = "Continue";
    $scope.continueTitle = DefaultContinueTitle;

    $scope.step = IntroStep;

    $scope.titleForStep = function(step) {
      switch (step) {
        case BackupStep:
          return "Download a backup of your data";
        case SignoutStep:
          return "Sign out of all your devices";
        case PasswordStep:
          return $scope.changePassword ? "Password information" : "Enter your current password";
        case SyncStep:
          return "Encrypt and sync data with new keys";
        case FinishStep:
          return "Sign back in to your devices";
        default:
          return null;
      }
    }

    $scope.configure = function() {
      if($scope.type == "change-pw") {
        $scope.title = "Change Password";
        $scope.changePassword = true;
      } else if($scope.type == "upgrade-security") {
        $scope.title = "Security Update";
        $scope.securityUpdate = true;
      }
    }();

    $scope.continue = function() {

      if($scope.lockContinue || $scope.isContinuing) {
        return;
      }

      // isContinuing is a way to lock the continue function separate from lockContinue
      // lockContinue can be locked by other places, but isContinuing is only lockable from within this function.

      $scope.isContinuing = true;

      if($scope.step == FinishStep) {
        $scope.dismiss();
        return;
      }

      let next = () => {
        $scope.step += 1;
        $scope.initializeStep($scope.step);

        $scope.isContinuing = false;
      }

      var preprocessor = $scope.preprocessorForStep($scope.step);
      if(preprocessor) {
        preprocessor(() => {
          next();
        }, () => {
          // on fail
          $scope.isContinuing = false;
        })
      } else {
        next();
      }
    }

    $scope.downloadBackup = function(encrypted) {
      archiveManager.downloadBackup(encrypted);
    }

    $scope.preprocessorForStep = function(step) {
      if(step == PasswordStep) {
        return (onSuccess, onFail) => {
          $scope.showSpinner = true;
          $scope.continueTitle = "Generating Keys...";
          $timeout(() => {
            $scope.validateCurrentPassword((success) => {
              $scope.showSpinner = false;
              $scope.continueTitle = DefaultContinueTitle;
              if(success) {
                onSuccess();
              } else {
                onFail && onFail();
              }
            });
          })
        }
      }
    }

    let FailedSyncMessage = "There was an error re-encrypting your items. Your password was changed, but not all your items were properly re-encrypted and synced. You should try syncing again. If all else fails, you should restore your notes from backup.";

    $scope.initializeStep = function(step) {
      if(step == SyncStep) {
        $scope.lockContinue = true;
        $scope.formData.status = "Processing encryption keys...";
        $scope.formData.processing = true;

        $scope.processPasswordChange((passwordSuccess) => {
          $scope.formData.statusError = !passwordSuccess;
          $scope.formData.processing = passwordSuccess;

          if(passwordSuccess) {
            $scope.formData.status = "Encrypting and syncing data with new keys...";

            $scope.resyncData((syncSuccess) => {
              $scope.formData.statusError = !syncSuccess;
              $scope.formData.processing = !syncSuccess;
              if(syncSuccess) {
                $scope.lockContinue = false;

                if($scope.changePassword) {
                  $scope.formData.status = "Successfully changed password and synced all items.";
                } else if($scope.securityUpdate) {
                  $scope.formData.status = "Successfully performed security update and synced all items.";
                }
              } else {
                $scope.formData.status = FailedSyncMessage;
              }
            })
          } else {
            $scope.formData.status = "Unable to process your password. Please try again.";
          }
        })
      }

      else if(step == FinishStep) {
        $scope.continueTitle = "Finish";
      }
    }

    $scope.validateCurrentPassword = async function(callback) {
      let currentPassword = $scope.formData.currentPassword;
      let newPass = $scope.securityUpdate ? currentPassword : $scope.formData.newPassword;

      if(!currentPassword || currentPassword.length == 0) {
        alertManager.alert({text: "Please enter your current password."});
        callback(false);
        return;
      }

      if($scope.changePassword) {
        if(!newPass || newPass.length == 0) {
          alertManager.alert({text: "Please enter a new password."});
          callback(false);
          return;
        }

        if(newPass != $scope.formData.newPasswordConfirmation) {
          alertManager.alert({text: "Your new password does not match its confirmation."});
          $scope.formData.status = null;
          callback(false);
          return;
        }
      }

      if(!authManager.user.email) {
        alertManager.alert({text: "We don't have your email stored. Please log out then log back in to fix this issue."});
        $scope.formData.status = null;
        callback(false);
        return;
      }

      // Ensure value for current password matches what's saved
      let authParams = await authManager.getAuthParams();
      let password = $scope.formData.currentPassword;
      cryptoManager.computeEncryptionKeysForUser(password, authParams).then(async (keys) => {
        let success = keys.mk === (await authManager.keys()).mk;
        if(success) {
          this.currentServerPw = keys.pw;
        } else {
          alertManager.alert({text: "The current password you entered is not correct. Please try again."});
        }
        $timeout(() => callback(success));
      });
    }

    $scope.resyncData = function(callback) {
      modelManager.setAllItemsDirty();
      syncManager.sync().then((response) => {
        if(!response || response.error) {
          alertManager.alert({text: FailedSyncMessage})
          $timeout(() => callback(false));
        } else {
          $timeout(() => callback(true));
        }
      });
    }

    $scope.processPasswordChange = async function(callback) {
      let newUserPassword = $scope.securityUpdate ? $scope.formData.currentPassword : $scope.formData.newPassword;

      let currentServerPw = this.currentServerPw;

      let results = await cryptoManager.generateInitialKeysAndAuthParamsForUser(authManager.user.email, newUserPassword);
      let newKeys = results.keys;
      let newAuthParams = results.authParams;

      // perform a sync beforehand to pull in any last minutes changes before we change the encryption key (and thus cant decrypt new changes)
      let syncResponse = await syncManager.sync();
      authManager.changePassword(await syncManager.getServerURL(), authManager.user.email, currentServerPw, newKeys, newAuthParams).then((response) => {
        if(response.error) {
          alertManager.alert({text: response.error.message ? response.error.message : "There was an error changing your password. Please try again."});
          $timeout(() => callback(false));
        } else {
          $timeout(() => callback(true));
        }
      })
    }
  }
}
