import template from '%/directives/component-view.pug';

import { isDesktopApplication } from '../../utils';

export class ComponentView {
  constructor(
    $rootScope,
    componentManager,
    desktopManager,
    $timeout,
    themeManager
  ) {
    this.restrict = 'E';
    this.template = template;
    this.scope = {
      component: '=',
      onLoad: '=?',
      manualDealloc: '=?'
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

  /* @ngInject */
  controller(
    $scope,
    $rootScope,
    $timeout,
    componentManager,
    desktopManager,
    themeManager
  ) {
    $scope.onVisibilityChange = function() {
      if(document.visibilityState == "hidden") {
        return;
      }

      if($scope.issueLoading) {
        $scope.reloadComponent();
      }
    }

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

        $timeout(() => {
          $scope.handleActivation();
        })
      },
      actionHandler: (component, action, data) => {
         if(action == "set-size") {
           componentManager.handleSetSizeEvent(component, data);
         }
      }
    });

    $scope.handleActivation = function() {
      // activationHandlers may be called multiple times, design below to be idempotent
      let component = $scope.component;
      if(!component.active) {
        return;
      }

      let iframe = componentManager.iframeForComponent(component);
      if(iframe) {
        $scope.loading = true;
        // begin loading error handler. If onload isn't called in x seconds, display an error
        if($scope.loadTimeout) { $timeout.cancel($scope.loadTimeout);}
        $scope.loadTimeout = $timeout(() => {
          if($scope.loading) {
            $scope.loading = false;
            $scope.issueLoading = true;

            if(!$scope.didAttemptReload) {
              $scope.didAttemptReload = true;
              $scope.reloadComponent();
            } else {
              // We'll attempt to reload when the tab gains focus
              document.addEventListener("visibilitychange", $scope.onVisibilityChange);
            }
          }
        }, 3500);
        iframe.onload = (event) => {
          let desktopError = false;
          try {
            // Accessing iframe.contentWindow.origin will throw an exception if we are in the web app, or if the iframe content
            // is remote content. The only reason it works in this case is because we're accessing a local extension.
            // In the future when the desktop app falls back to the web location if local fail loads, we won't be able to access this property anymore.
            if(isDesktopApplication() && (iframe.contentWindow.origin == null || iframe.contentWindow.origin == 'null')) {
              /*
              Don't attempt reload in this case, as it results in infinite loop, since a reload will deactivate the extension and then reactivate.
              This can cause this componentView to be dealloced and a new one to be instantiated. This happens in editor.js, which we'll need to look into.
              Don't return from this clause either, since we don't want to cancel loadTimeout (that will trigger reload). Instead, handle custom fail logic here.
              */
              desktopError = true;
            }
          } catch (e) {

          }

          $timeout.cancel($scope.loadTimeout);
          componentManager.registerComponentWindow(component, iframe.contentWindow).then(() => {
            // Add small timeout to, as $scope.loading controls loading overlay,
            // which is used to avoid flicker when enabling extensions while having an enabled theme
            // we don't use ng-show because it causes problems with rendering iframes after timeout, for some reason.
            $timeout(() => {
              $scope.loading = false;
              $scope.issueLoading = desktopError; /* Typically we'd just set this to false at this point, but we now account for desktopError */
              $scope.onLoad && $scope.onLoad($scope.component);
            }, 7)
          })

        };
      }
    }


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
        // console.log("Loading", $scope.component.name, $scope.getUrl(), component.valid_until);

        $scope.reloadStatus();
      }
    }

    $scope.$on("ext-reload-complete", () => {
      $scope.reloadStatus(false);
    })

    $scope.reloadComponent = function() {
      // console.log("Reloading component", $scope.component);
      // force iFrame to deinit, allows new one to be created
      $scope.componentValid = false;
      componentManager.reloadComponent($scope.component).then(() => {
        $scope.reloadStatus();
      })
    }

    $scope.reloadStatus = function(doManualReload = true) {
      let component = $scope.component;
      $scope.reloading = true;
      let previouslyValid = $scope.componentValid;

      let offlineRestricted = component.offlineOnly && !isDesktopApplication();

      let urlError =
        (!isDesktopApplication() && !component.hasValidHostedUrl())
        ||
        (isDesktopApplication() && (!component.local_url && !component.hasValidHostedUrl()))

      $scope.expired = component.valid_until && component.valid_until <= new Date();

      // Here we choose our own readonly state based on custom logic. However, if a parent
      // wants to implement their own readonly logic, they can lock it.
      if(!component.lockReadonly) {
        component.readonly = $scope.expired;
      }

      $scope.componentValid = !offlineRestricted && !urlError;

      if(!$scope.componentValid) {
        // required to disable overlay
        $scope.loading = false;
      }

      if(offlineRestricted) $scope.error = 'offline-restricted';
      else if(urlError) $scope.error = 'url-missing';
      else $scope.error = null;

      if($scope.componentValid !== previouslyValid) {
        if($scope.componentValid) {
          // We want to reload here, rather than `activateComponent`, because the component will already have attempted to been activated.
          componentManager.reloadComponent(component, true);
        }
      }

      if($scope.expired && doManualReload) {
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
      document.removeEventListener("visibilitychange", $scope.onVisibilityChange);
    }

    $scope.$on("$destroy", function() {
      $scope.destroy();
    });
  }
}
