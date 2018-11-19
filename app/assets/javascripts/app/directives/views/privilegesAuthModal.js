/*
  The purpose of the conflict resoltion modal is to present two versions of a conflicted item,
  and allow the user to choose which to keep (or to keep both.)
*/

class PrivilegesAuthModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/privileges-auth-modal.html";
    this.scope = {
      action: "=",
      onSuccess: "=",
      onCancel: "=",
    };
  }

  link($scope, el, attrs) {
    $scope.dismiss = function() {
      el.remove();
    }
  }

  controller($scope, privilegesManager, passcodeManager, authManager, $timeout) {
    'ngInject';

    $scope.authenticationParameters = {};
    $scope.sessionLengthOptions = privilegesManager.getSessionLengthOptions();

    privilegesManager.getSelectedSessionLength().then((length) => {
      $timeout(() => {
        $scope.selectedSessionLength = length;
      })
    })

    $scope.selectSessionLength = function(length) {
      $scope.selectedSessionLength = length;
    }

    privilegesManager.netCredentialsForAction($scope.action).then((credentials) => {
      $timeout(() => {
        $scope.requiredCredentials = credentials;
      });
    });

    $scope.promptForCredential = function(credential) {
      return privilegesManager.displayInfoForCredential(credential).prompt;
    }

    $scope.cancel = function() {
      $scope.dismiss();
      $scope.onCancel && $scope.onCancel();
    }

    $scope.isCredentialInFailureState = function(credential) {
      if(!$scope.failedCredentials) {
        return false;
      }
      return $scope.failedCredentials.find((candidate) => {
        return candidate == credential;
      }) != null;
    }

    $scope.submit = function() {
      privilegesManager.authenticateAction($scope.action, $scope.authenticationParameters).then((result) => {
        $timeout(() => {
          if(result.success) {
            privilegesManager.setSessionLength($scope.selectedSessionLength);
            $scope.onSuccess();
            $scope.dismiss();
          } else {
            $scope.failedCredentials = result.failedCredentials;
          }
        })
      })
    }

  }
}

angular.module('app').directive('privilegesAuthModal', () => new PrivilegesAuthModal);
