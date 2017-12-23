class ComponentModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/component-modal.html";
    this.scope = {
      show: "=",
      component: "=",
      callback: "="
    };
  }

  link($scope, el, attrs, componentManager) {
    $scope.el = el;
  }

  controller($scope, componentManager) {
    'ngInject';

    let identifier = "modal-" + $scope.component.uuid;

    $scope.dismiss = function() {
      componentManager.deregisterHandler(identifier);
      $scope.el.remove();
    }

    $scope.url = function() {
      return componentManager.urlForComponent($scope.component);
    }

    componentManager.registerHandler({identifier: identifier, areas: ["modal"],
     actionHandler: function(component, action, data){
       if(action == "set-size") {
         componentManager.handleSetSizeEvent(component, data);
       }
    }.bind(this)});
  }

}

angular.module('app.frontend').directive('componentModal', () => new ComponentModal);
