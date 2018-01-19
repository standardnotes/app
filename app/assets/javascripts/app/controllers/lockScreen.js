class LockScreen {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "lock-screen.html";
    this.scope = {
      onSuccess: "&",
    };
  }

  controller($scope, passcodeManager) {
    'ngInject';

    $scope.formData = {};

    $scope.submitPasscodeForm = function() {
      passcodeManager.unlock($scope.formData.passcode, (success) => {
        if(!success) {
          alert("Invalid passcode. Please try again.");
          return;
        }

        $scope.onSuccess()();
      })
    }
  }

}

angular.module('app').directive('lockScreen', () => new LockScreen);
