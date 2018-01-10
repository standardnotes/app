class ComponentView {

  constructor(componentManager, $timeout) {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/component-view.html";
    this.scope = {
      component: "="
    };

    this.componentManager = componentManager;
    this.timeout = $timeout;
  }

  link($scope, el, attrs, ctrl) {
    $scope.el = el;

    let identifier = "component-view-" + Math.random();

    this.componentManager.registerHandler({identifier: identifier, areas: ["*"], activationHandler: (component) => {
      if(component.active) {
        this.timeout(function(){
          var iframe = this.componentManager.iframeForComponent(component);
          if(iframe) {
            iframe.onload = function() {
              this.componentManager.registerComponentWindow(component, iframe.contentWindow);
            }.bind(this);
          }
        }.bind(this));
      }
    },
    actionHandler: function(component, action, data) {
       if(action == "set-size") {
         this.componentManager.handleSetSizeEvent(component, data);
       }
    }.bind(this)});

    $scope.$watch('component', function(component, prevComponent){
      // console.log("Component View Setting Component", component);
      ctrl.componentValueChanging(component, prevComponent);
    });
  }

  controller($scope, $timeout, componentManager, desktopManager) {
    'ngInject';

    console.log("Creating New Component View");

    this.componentValueChanging = (component, prevComponent) => {
      if(prevComponent && component !== prevComponent) {
        // Deactive old component
        console.log("DEACTIVATING OLD COMPONENT", prevComponent);
        componentManager.deactivateComponent(prevComponent);
      }

      if(component) {
        componentManager.activateComponent(component);
      }
    }

    $scope.$on("$destroy", function() {
      console.log("DESTROY COMPONENT VIEW");
      componentManager.deregisterHandler($scope.identifier);
      if($scope.component) {
        componentManager.deactivateComponent($scope.component);
      }
    });
  }

}

angular.module('app.frontend').directive('componentView', (componentManager, $timeout) => new ComponentView(componentManager, $timeout));
