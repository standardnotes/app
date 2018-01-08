class ComponentView {

  constructor() {
    this.restrict = "E";
    this.templateUrl = "frontend/directives/component-view.html";
    this.scope = {
      component: "="
    };
  }

  link($scope, el, attrs, ctrl) {
    $scope.el = el;

    $scope.$watch('component', function(component, prevComponent){
      console.log("Component View Setting Component", component);
      ctrl.componentValueChanging(component, prevComponent);
    });
  }

  controller($scope, $timeout, componentManager, desktopManager) {
    'ngInject';

    this.componentValueChanging = (component, prevComponent) => {
      if(prevComponent && component !== prevComponent) {
        // Deactive old component
        console.log("DEACTIVATING OLD COMPONENT", prevComponent);
        componentManager.deactivateComponent(prevComponent);
      }

      if(component) {
        componentManager.activateComponent(component);
        componentManager.setEventFlowForComponent(component, 1);
      }
    }

    let identifier = "component-view-" + Math.random();

    $scope.url = function() {
      if($scope.component.offlineOnly) {
        return $scope.component.local_url;
      }

      if(desktopManager.isDesktop && $scope.component.local_url) {
        return $scope.component.local_url;
      }

      return $scope.component.hosted_url || $scope.component.url;
    }

    componentManager.registerHandler({identifier: identifier, areas: ["*"], activationHandler: (component) => {
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
  }

}

angular.module('app.frontend').directive('componentView', () => new ComponentView);
