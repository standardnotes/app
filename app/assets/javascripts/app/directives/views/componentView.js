class ComponentView {

  constructor(componentManager, $timeout) {
    this.restrict = "E";
    this.templateUrl = "directives/component-view.html";
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
      ctrl.componentValueChanging(component, prevComponent);
    });
  }

  controller($scope, $timeout, componentManager, desktopManager) {
    'ngInject';

    this.componentValueChanging = (component, prevComponent) => {
      if(prevComponent && component !== prevComponent) {
        // Deactive old component
        componentManager.deactivateComponent(prevComponent);
      }

      if(component) {
        componentManager.activateComponent(component);
        component.runningLocally = $scope.getUrl
        console.log("Loading", $scope.component.name, $scope.getUrl());
      }
    }

    $scope.getUrl = function() {
      var url = componentManager.urlForComponent($scope.component);
      $scope.component.runningLocally = url !== ($scope.component.url || $scope.component.hosted_url);
      return url;
    }

    $scope.$on("$destroy", function() {
      componentManager.deregisterHandler($scope.identifier);
      if($scope.component) {
        componentManager.deactivateComponent($scope.component);
      }
    });
  }

}

angular.module('app').directive('componentView', (componentManager, $timeout) => new ComponentView(componentManager, $timeout));
