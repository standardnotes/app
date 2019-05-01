class PermissionsModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/permissions-modal.html";
    this.scope = {
      show: "=",
      component: "=",
      permissionsString: "=",
      callback: "="
    };
  }

  link($scope, el, attrs) {

    $scope.dismiss = function() {
      el.remove();
    }

    $scope.accept = function() {
      $scope.callback(true);
      $scope.dismiss();
    }

    $scope.deny = function() {
      $scope.callback(false);
      $scope.dismiss();
    }
  }

  controller($scope, modelManager) {
    'ngInject';

  }

}

angular.module('app').directive('permissionsModal', () => new PermissionsModal);
