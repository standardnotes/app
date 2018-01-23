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

    if($scope.component.directiveController) {
      $scope.component.directiveController.dismiss = function(callback) {
        $scope.dismiss(callback);
      }
    }

    $scope.dismiss = function(callback) {
      var onDismiss = $scope.component.directiveController && $scope.component.directiveController.onDismiss();
      $scope.el.remove();
      $scope.$destroy();
      onDismiss && onDismiss();
      callback && callback();
    }

  }

}

angular.module('app').directive('componentModal', () => new ComponentModal);
