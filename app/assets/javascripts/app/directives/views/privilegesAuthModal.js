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

  controller($scope, privilegesManager, $timeout) {
    'ngInject';

    $scope.privileges = privilegesManager.privilegesForAction($scope.action);

    $scope.cancel = function() {
      $scope.dismiss();
      $scope.onCancel && $scope.onCancel();
    }

    $scope.doesPrivHaveFail = function(priv) {
      if(!$scope.failedPrivs) {
        return false;
      }
      return $scope.failedPrivs.find((failedPriv) => {
        return failedPriv.name == priv.name;
      }) != null;
    }

    $scope.submit = function() {
      privilegesManager.verifyPrivilegesForAction($scope.action, $scope.privileges).then((result) => {
        console.log("Result", result);
        $timeout(() => {
          if(result.success) {
            $scope.onSuccess();
            $scope.dismiss();
          } else {
            $scope.failedPrivs = result.failedPrivs;
          }
        })
      })
    }

  }
}

angular.module('app').directive('privilegesAuthModal', () => new PrivilegesAuthModal);
