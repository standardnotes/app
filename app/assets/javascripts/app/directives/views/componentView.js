class ComponentView {

  constructor(componentManager, desktopManager, $timeout) {
    this.restrict = "E";
    this.templateUrl = "directives/component-view.html";
    this.scope = {
      component: "=",
      manualDealloc: "="
    };

    this.componentManager = componentManager;
    this.desktopManager = desktopManager;
    this.timeout = $timeout;
  }

  link($scope, el, attrs, ctrl) {
    $scope.el = el;

    $scope.identifier = "component-view-" + Math.random();

    // console.log("Registering handler", $scope.identifier, $scope.component.name);

    this.componentManager.registerHandler({identifier: $scope.identifier, areas: [$scope.component.area], activationHandler: (component) => {
      if(component.active) {
        this.timeout(() => {
          var iframe = this.componentManager.iframeForComponent(component);
          if(iframe) {
            iframe.onload = function() {
              this.componentManager.registerComponentWindow(component, iframe.contentWindow);
            }.bind(this);
          }
        });
      }
    },
    actionHandler: (component, action, data) => {
       if(action == "set-size") {
         this.componentManager.handleSetSizeEvent(component, data);
       }
    }});

    $scope.updateObserver = this.desktopManager.registerUpdateObserver((component) => {
      if(component == $scope.component && component.active) {
        $scope.reloadComponent();
      }
    })

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
        console.log("Loading", $scope.component.name, $scope.getUrl(), component.valid_until);

        $scope.reloadStatus();
      }
    }

    $scope.reloadComponent = function() {
      console.log("Reloading component", $scope.component);
      componentManager.deactivateComponent($scope.component);
      $timeout(() => {
        componentManager.activateComponent($scope.component);
      })
    }

    $scope.reloadStatus = function() {
      let component = $scope.component;
      $scope.reloading = true;
      let previouslyValid = $scope.componentValid;

      var expired, offlineRestricted, urlError;

      offlineRestricted = component.offlineOnly && !isDesktopApplication();
      urlError = !isDesktopApplication() && (!component.url && !component.hosted_url);
      expired = component.valid_until && component.valid_until <= new Date();

      $scope.componentValid = !offlineRestricted && !urlError && !expired;

      if(offlineRestricted) $scope.error = 'offline-restricted';
      if(urlError) $scope.error = 'url-missing';
      if(expired) $scope.error = 'expired';

      if($scope.componentValid !== previouslyValid) {
        if($scope.componentValid) {
          componentManager.activateComponent(component);
        }
      }

      $timeout(() => {
        $scope.reloading = false;
      }, 500)
    }

    $scope.getUrl = function() {
      var url = componentManager.urlForComponent($scope.component);
      $scope.component.runningLocally = (url !== $scope.component.url) && url !== ($scope.component.hosted_url);
      return url;
    }

    $scope.$on("$destroy", function() {
      // console.log("Deregistering handler", $scope.identifier, $scope.component.name);
      componentManager.deregisterHandler($scope.identifier);
      if($scope.component && !$scope.manualDealloc) {
        componentManager.deactivateComponent($scope.component);
      }

      desktopManager.deregisterUpdateObserver($scope.updateObserver);
    });
  }

}

angular.module('app').directive('componentView', (componentManager, desktopManager, $timeout) => new ComponentView(componentManager, desktopManager, $timeout));
