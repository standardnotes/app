class ComponentView {

  constructor($rootScope, componentManager, desktopManager, $timeout) {
    this.restrict = "E";
    this.templateUrl = "directives/component-view.html";
    this.scope = {
      component: "=",
      manualDealloc: "="
    };

    this.$rootScope = $rootScope;
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

  controller($scope, $rootScope, $timeout, componentManager, desktopManager) {
    'ngInject';

    /*
    General note regarding activation/deactivation of components:
    We pass `true` to componentManager.ac/detivateComponent for the `dontSync` parameter.
    The activation we do in here is not global, but just local, so we don't need to sync the state.
    For example, if we activate an editor, we just need to do that for display purposes, but dont
    need to perform a sync to propagate that .active flag.
    */

    this.componentValueChanging = (component, prevComponent) => {
      //
      // See comment above about passing true to componentManager.ac/detivateComponent
      //
      if(prevComponent && component !== prevComponent) {
        // Deactive old component
        componentManager.deactivateComponent(prevComponent, true);
      }

      if(component) {
        componentManager.activateComponent(component, true);
        console.log("Loading", $scope.component.name, $scope.getUrl(), component.valid_until);

        $scope.reloadStatus();
      }
    }

    $scope.$on("ext-reload-complete", () => {
      $scope.reloadStatus(false);
    })

    $scope.reloadComponent = function() {
      console.log("Reloading component", $scope.component);
      componentManager.reloadComponent($scope.component);
    }

    $scope.reloadStatus = function(doManualReload = true) {
      let component = $scope.component;
      $scope.reloading = true;
      let previouslyValid = $scope.componentValid;

      var expired, offlineRestricted, urlError;

      offlineRestricted = component.offlineOnly && !isDesktopApplication();

      urlError =
        (!isDesktopApplication() && (!component.hasValidHostedUrl()))
        ||
        (isDesktopApplication() && (!component.local_url && !component.hasValidHostedUrl()))

      expired = component.valid_until && component.valid_until <= new Date();

      $scope.componentValid = !offlineRestricted && !urlError && !expired;

      if(offlineRestricted) $scope.error = 'offline-restricted';
      else if(urlError) $scope.error = 'url-missing';
      else if(expired) $scope.error = 'expired';
      else $scope.error = null;

      if($scope.componentValid !== previouslyValid) {
        if($scope.componentValid) {
          componentManager.activateComponent(component, true);
        }
      }

      if(expired && doManualReload) {
        // Try reloading, handled by footer, which will open Extensions window momentarily to pull in latest data
        // Upon completion, this method, reloadStatus, will be called, upon where doManualReload will be false to prevent recursion.
        $rootScope.$broadcast("reload-ext-data");
      }

      $timeout(() => {
        $scope.reloading = false;
      }, 500)
    }

    $scope.getUrl = function() {
      var url = componentManager.urlForComponent($scope.component);
      $scope.component.runningLocally = (url == $scope.component.local_url);
      return url;
    }

    $scope.destroy = function() {
      componentManager.deregisterHandler($scope.identifier);
      if($scope.component && !$scope.manualDealloc) {
        componentManager.deactivateComponent($scope.component, true);
      }

      desktopManager.deregisterUpdateObserver($scope.updateObserver);
    }

    $scope.$on("$destroy", function() {
      // console.log("Deregistering handler", $scope.identifier, $scope.component.name);
      $scope.destroy();
    });
  }

}

angular.module('app').directive('componentView', ($rootScope, componentManager, desktopManager, $timeout) => new ComponentView($rootScope, componentManager, desktopManager, $timeout));
