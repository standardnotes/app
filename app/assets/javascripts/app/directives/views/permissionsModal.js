import template from '%/directives/permissions-modal.pug';

export class PermissionsModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      show: '=',
      component: '=',
      permissionsString: '=',
      callback: '='
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

  /* @ngInject */
  controller($scope, modelManager) {

  }
}
