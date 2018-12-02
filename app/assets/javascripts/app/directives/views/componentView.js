class ComponentView {

  constructor($rootScope, componentManager, desktopManager, $timeout, themeManager) {
    this.restrict = "E";
    this.templateUrl = "directives/component-view.html";
    this.scope = {
      component: "=",
      manualDealloc: "="
    };

    this.desktopManager = desktopManager;
  }

  link($scope, el, attrs, ctrl) {
    $scope.el = el;

    $scope.componentValid = true;

    $scope.updateObserver = this.desktopManager.registerUpdateObserver((component) => {
      if(component == $scope.component && component.active) {
        $scope.reloadComponent();
      }
    })

    $scope.$watch('component', function(component, prevComponent){
      ctrl.componentValueChanging(component, prevComponent);
    });
  }

  controller($scope, $rootScope, $timeout, componentManager, desktopManager, themeManager) {
    'ngInject';

    $scope.themeHandlerIdentifier = "component-view-" + Math.random();
    componentManager.registerHandler({identifier: $scope.themeHandlerIdentifier, areas: ["themes"], activationHandler: (component) => {
      $scope.reloadThemeStatus();
    }});

    $scope.identifier = "component-view-" + Math.random();

    componentManager.registerHandler({
      identifier: $scope.identifier,
      areas: [$scope.component.area],
      activationHandler: (component) => {
        if(component !== $scope.component) {
          return;
        }

        // activationHandlers may be called multiple times, design below to be idempotent
        if(component.active) {
          $scope.loading = true;
          let iframe = componentManager.iframeForComponent(component);
          if(iframe) {
            // begin loading error handler. If onload isn't called in x seconds, display an error
            if($scope.loadTimeout) { $timeout.cancel($scope.loadTimeout);}
            $scope.loadTimeout = $timeout(() => {
              if($scope.loading) {
                $scope.issueLoading = true;
                componentManager.registerComponentForReload($scope.component);
              }
            }, 3500);
            iframe.onload = function(event) {
              // console.log("iframe loaded for component", component.name, "cancelling load timeout", $scope.loadTimeout);
              $timeout.cancel($scope.loadTimeout);
              $scope.loading = false;
              $scope.issueLoading = false;
              componentManager.registerComponentWindow(component, iframe.contentWindow);
            }.bind(this);
          }
        }
    },
      actionHandler: (component, action, data) => {
         if(action == "set-size") {
           componentManager.handleSetSizeEvent(component, data);
         }
      }}
    );


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
          // We want to reload here, rather than `activateComponent`, because the component will already have attempted to been activated.
          componentManager.reloadComponent(component, true);
        }
      }

      if(expired && doManualReload) {
        // Try reloading, handled by footer, which will open Extensions window momentarily to pull in latest data
        // Upon completion, this method, reloadStatus, will be called, upon where doManualReload will be false to prevent recursion.
        $rootScope.$broadcast("reload-ext-data");
      }

      $scope.reloadThemeStatus();

      $timeout(() => {
        $scope.reloading = false;
      }, 500)
    }

    $scope.reloadThemeStatus = function() {
      if(!$scope.component.acceptsThemes()) {
        if(themeManager.hasActiveTheme()) {
          if(!$scope.dismissedNoThemesMessage) {
            $scope.showNoThemesMessage = true;
          }
        } else {
          // Can be the case if we've just deactivated a theme
          $scope.showNoThemesMessage = false;
        }
      }
    }

    $scope.noThemesMessageDismiss = function() {
      $scope.showNoThemesMessage = false;
      $scope.dismissedNoThemesMessage = true;
    }

    $scope.disableActiveTheme = function() {
      themeManager.deactivateAllThemes();
      $scope.noThemesMessageDismiss();
    }

    $scope.getUrl = function() {
      var url = componentManager.urlForComponent($scope.component);
      $scope.component.runningLocally = (url == $scope.component.local_url);
      return url;
    }

    $scope.destroy = function() {
      componentManager.deregisterHandler($scope.themeHandlerIdentifier);
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
