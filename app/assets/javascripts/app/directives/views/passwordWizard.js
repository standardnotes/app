class PasswordWizard {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/password-wizard.html";
    this.scope = {
      type: "="
    };
  }

  controller($scope, modelManager, archiveManager, $timeout) {
    'ngInject';

    const IntroStep = 0;
    const BackupStep = 1;
    const SignoutStep = 2;
    const PasswordStep = 3;
    const SyncStep = 4;
    const FinishStep = 5;

    let DefaultContinueTitle = "Continue";
    $scope.continueTitle = DefaultContinueTitle;

    $scope.step = PasswordStep;

    $scope.titleForStep = function(step) {
      switch (step) {
        case BackupStep:
          return "Download a backup of your data";
        case SignoutStep:
          return "Sign out of all your devices";
        case PasswordStep:
          return $scope.changePassword ? "Enter password information" : "Enter your current password";
        case SyncStep:
          return "Encrypt and sync data with new keys";
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
            $scope.validatePasswordInformation(() => {
              $scope.showSpinner = false;
              $scope.continueTitle = DefaultContinueTitle;
              callback();
            });
          })
        }
      }
    }

    $scope.initializeStep = function(step) {
      if(step == SyncStep) {
        $scope.lockContinue = true;
        $scope.resyncData(() => {
          $scope.lockContinue = false;
        })
      }
    }

    $scope.validatePasswordInformation = function(callback) {
      $timeout(() => {
        callback();
      }, 1000)
    }

    $scope.resyncData = function(callback) {
      $timeout(() => {
        callback();
      }, 2000)
    }

    $scope.submitPasswordChange = function() {

      let newPass = $scope.newPasswordData.newPassword;
      let currentPass = $scope.newPasswordData.currentPassword;

      if(!newPass || newPass.length == 0) {
        return;
      }

      if(newPass != $scope.newPasswordData.newPasswordConfirmation) {
        alert("Your new password does not match its confirmation.");
        $scope.newPasswordData.status = null;
        return;
      }

      var email = $scope.user.email;
      if(!email) {
        alert("We don't have your email stored. Please log out then log back in to fix this issue.");
        $scope.newPasswordData.status = null;
        return;
      }

      $scope.newPasswordData.status = "Generating New Keys...";
      $scope.newPasswordData.showForm = false;

      // perform a sync beforehand to pull in any last minutes changes before we change the encryption key (and thus cant decrypt new changes)
      syncManager.sync(function(response){
        authManager.changePassword(email, currentPass, newPass, function(response){
          if(response.error) {
            alert("There was an error changing your password. Please try again.");
            $scope.newPasswordData.status = null;
            return;
          }

          // re-encrypt all items
          $scope.newPasswordData.status = "Re-encrypting all items with your new key...";

          modelManager.setAllItemsDirty();
          syncManager.sync(function(response){
            if(response.error) {
              alert("There was an error re-encrypting your items. Your password was changed, but not all your items were properly re-encrypted and synced. You should try syncing again. If all else fails, you should restore your notes from backup.")
              return;
            }
            $scope.newPasswordData.status = "Successfully changed password and re-encrypted all items.";
            $timeout(function(){
              alert("Your password has been changed, and your items successfully re-encrypted and synced. You must sign out of all other signed in applications and sign in again, or else you may corrupt your data.")
              $scope.newPasswordData = {};
            }, 1000)
          });
        })
      }, null, "submitPasswordChange")
    }

  }

}

angular.module('app').directive('passwordWizard', () => new PasswordWizard);
