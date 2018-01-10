class ComponentModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/component-modal.html";
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
      // Setting will null out compinent-view's component, which will handle deactivation
      $scope.component = null;
      $timeout(() => {
        $scope.el.remove();
        onDismiss && onDismiss();
        callback && callback();
      })
    }

  }

}

angular.module('app.frontend').directive('componentModal', () => new ComponentModal);
