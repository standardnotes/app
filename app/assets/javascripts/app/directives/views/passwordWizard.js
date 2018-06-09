class PasswordWizard {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/password-wizard.html";
    this.scope = {
      type: "="
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  controller($scope, modelManager, archiveManager, authManager, syncManager, $timeout) {
    'ngInject';

    $scope.dismiss = function() {
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

      if($scope.step == FinishStep) {
        $scope.dismiss();
        return;
      }

      let next = () => {
        $scope.step += 1;
        $scope.initializeStep($scope.step);
      }

      var preprocessor = $scope.preprocessorForStep($scope.step);
      if(preprocessor) {
        preprocessor(() => {
          next();
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
        return (callback) => {
          $scope.showSpinner = true;
          $scope.continueTitle = "Generating Keys...";
          $timeout(() => {
            $scope.validateCurrentPassword((success) => {
              $scope.showSpinner = false;
              $scope.continueTitle = DefaultContinueTitle;
              if(success) {
                callback();
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

    $scope.validateCurrentPassword = function(callback) {
      let currentPassword = $scope.formData.currentPassword;
      let newPass = $scope.securityUpdate ? currentPassword : $scope.formData.newPassword;

      if($scope.changePassword) {
        if(!newPass || newPass.length == 0) {
          callback(false);
          return;
        }

        if(newPass != $scope.formData.newPasswordConfirmation) {
          alert("Your new password does not match its confirmation.");
          $scope.formData.status = null;
          callback(false);
          return;
        }
      }

      if(!authManager.user.email) {
        alert("We don't have your email stored. Please log out then log back in to fix this issue.");
        $scope.formData.status = null;
        callback(false);
        return;
      }

      // Ensure value for current password matches what's saved
      let authParams = authManager.getAuthParams();
      let password = $scope.formData.currentPassword;
      SFJS.crypto.computeEncryptionKeysForUser(password, authParams).then((keys) => {
        let success = keys.mk === authManager.keys().mk;
        if(success) {
          this.currentServerPw = keys.pw;
        } else {
          alert("The current password you entered is not correct. Please try again.");
        }
        $timeout(() => callback(success));
      });
    }

    $scope.resyncData = function(callback) {
      modelManager.setAllItemsDirty();
      syncManager.sync((response) => {
        if(response.error) {
          alert(FailedSyncMessage)
          $timeout(() => callback(false));
        } else {
          $timeout(() => callback(true));
        }
      });
    }

    $scope.processPasswordChange = function(callback) {
      let newUserPassword = $scope.securityUpdate ? $scope.formData.currentPassword : $scope.formData.newPassword;

      let currentServerPw = this.currentServerPw;

      SFJS.crypto.generateInitialKeysAndAuthParamsForUser(authManager.user.email, newUserPassword).then((results) => {
        let newKeys = results.keys;
        let newAuthParams = results.authParams;

        // perform a sync beforehand to pull in any last minutes changes before we change the encryption key (and thus cant decrypt new changes)
        syncManager.sync((response) => {
          authManager.changePassword(currentServerPw, newKeys, newAuthParams, (response) => {
            if(response.error) {
              alert(response.error.message ? response.error.message : "There was an error changing your password. Please try again.");
              $timeout(() => callback(false));
            } else {
              $timeout(() => callback(true));
            }
          })
        }, null, "submitPasswordChange")
      });
    }
  }

}

angular.module('app').directive('passwordWizard', () => new PasswordWizard);
