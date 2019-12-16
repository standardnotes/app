import template from '%/lock-screen.pug';

export class LockScreen {
  constructor() {
    this.restrict = "E";
    this.template = template;
    this.scope = {
      onSuccess: "&",
    };
  }

  /* @ngInject */
  controller($scope, passcodeManager, authManager, syncManager, storageManager, alertManager) {
    $scope.formData = {};

    this.visibilityObserver = passcodeManager.addVisibilityObserver((visible) => {
      if(visible) {
        let input = document.getElementById("passcode-input");
        if(input) {
          input.focus();
        }
      }
    })

    $scope.$on("$destroy", () => {
      passcodeManager.removeVisibilityObserver(this.visibilityObserver);
    });

    $scope.submitPasscodeForm = function() {
      if(!$scope.formData.passcode || $scope.formData.passcode.length == 0) {
        return;
      }
      passcodeManager.unlock($scope.formData.passcode, (success) => {
        if(!success) {
          alertManager.alert({text: "Invalid passcode. Please try again."});
          return;
        }

        $scope.onSuccess()();
      })
    }

    $scope.forgotPasscode = function() {
      $scope.formData.showRecovery = true;
    }

    $scope.beginDeleteData = function() {
      alertManager.confirm({text: "Are you sure you want to clear all local data?", destructive: true, onConfirm: () => {
        authManager.signout(true).then(() => {
          window.location.reload();
        })
      }})
    }
  }
}
