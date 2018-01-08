class ComponentModal {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/component-modal.html";
    this.scope = {
      show: "=",
      component: "=",
      controller: "=",
      callback: "="
    };
  }

  link($scope, el, attrs) {
    $scope.el = el;
  }

  controller($scope, $timeout, componentManager) {
    'ngInject';

    let identifier = "modal-" + $scope.component.uuid;

    $scope.component.directiveController.dismiss = function() {
      $scope.component.show = false;
      componentManager.deactivateComponent($scope.component);
      componentManager.deregisterHandler(identifier);
      $scope.el.remove();
    }

    $scope.dismiss = function() {
      $scope.component.directiveController.dismiss();
    }

    $scope.url = function() {
      return componentManager.urlForComponent($scope.component);
    }

    componentManager.registerHandler({identifier: identifier, areas: ["modal"], activationHandler: (component) => {
      if(component.active) {
        $timeout(function(){
          var iframe = componentManager.iframeForComponent(component);
          if(iframe) {
            iframe.onload = function() {
              componentManager.registerComponentWindow(component, iframe.contentWindow);
            }.bind(this);
          }
        }.bind(this));
      }
    },
    actionHandler: function(component, action, data) {
       if(action == "set-size") {
         componentManager.handleSetSizeEvent(component, data);
       }
    }.bind(this)});

    componentManager.activateComponent($scope.component);
  }

}

angular.module('app.frontend').directive('componentModal', () => new ComponentModal);
