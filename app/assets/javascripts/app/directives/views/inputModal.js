import template from '%/directives/input-modal.pug';

export class InputModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      type: '=',
      title: '=',
      message: '=',
      placeholder: '=',
      callback: '&'
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  /* @ngInject */
  controller($scope, modelManager, archiveManager, authManager, syncManager, $timeout) {
    $scope.formData = {};

    $scope.dismiss = function() {
      $scope.el.remove();
      $scope.$destroy();
    }

    $scope.submit = function() {
      $scope.callback()($scope.formData.input);
      $scope.dismiss();
    }
  }
}
