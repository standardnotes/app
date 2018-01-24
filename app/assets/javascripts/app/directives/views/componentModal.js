class ComponentModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "directives/component-modal.html";
    this.scope = {
      show: "=",
      component: "=",
      callback: "=",
      onDismiss: "&"
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  controller($scope, $timeout, componentManager) {
    'ngInject';

    $scope.dismiss = function(callback) {
      $scope.el.remove();
      $scope.$destroy();
      $scope.onDismiss && $scope.onDismiss()($scope.component);
      callback && callback();
    }
  }

}

angular.module('app').directive('componentModal', () => new ComponentModal);
