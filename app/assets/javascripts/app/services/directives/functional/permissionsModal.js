class PermissionsModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/permissions-modal.html";
    this.scope = {
      show: "=",
      component: "=",
      permissions: "=",
      callback: "="
    };
  }

  link($scope, el, attrs) {
    'ngInject';

    console.log($scope.component);

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

}

angular.module('app.frontend').directive('permissionsModal', () => new PermissionsModal);
