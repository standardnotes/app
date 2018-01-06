angular.module('app.frontend')
  .directive("footer", function(authManager){
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'frontend/footer.html',
      replace: true,
      controller: 'FooterCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$on("sync:updated_token", function(){
          ctrl.syncUpdated();
          ctrl.findErrors();
          ctrl.updateOfflineStatus();
        })
        scope.$on("sync:error", function(){
          ctrl.findErrors();
          ctrl.updateOfflineStatus();
        })
      }
    }
  })
  .controller('FooterCtrl', function ($rootScope, authManager, modelManager, $timeout, dbManager,
    syncManager, storageManager, passcodeManager, componentManager, singletonManager) {

    this.user = authManager.user;

    this.updateOfflineStatus = function() {
      this.offline = authManager.offline();
    }
    this.updateOfflineStatus();

    if(this.offline && !passcodeManager.hasPasscode()) {
      this.showAccountMenu = true;
    }

    this.findErrors = function() {
      this.error = syncManager.syncStatus.error;
    }
    this.findErrors();

    this.onAuthSuccess = function() {
      this.showAccountMenu = false;
    }.bind(this)

    this.accountMenuPressed = function() {
      this.serverData = {};
      this.showAccountMenu = !this.showAccountMenu;
      this.showFaq = false;
      this.showNewPasswordForm = false;
      this.showExtensionsMenu = false;
      this.showIOMenu = false;
    }

    this.toggleExtensions = function() {
      this.showAccountMenu = false;
      this.showIOMenu = false;
      this.showExtensionsMenu = !this.showExtensionsMenu;
    }

    this.toggleIO = function() {
      this.showIOMenu = !this.showIOMenu;
      this.showExtensionsMenu = false;
      this.showAccountMenu = false;
    }

    this.hasPasscode = function() {
      return passcodeManager.hasPasscode();
    }

    this.lockApp = function() {
      $rootScope.lockApplication();
    }

    this.refreshData = function() {
      this.isRefreshing = true;
      syncManager.sync(function(response){
        $timeout(function(){
          this.isRefreshing = false;
        }.bind(this), 200)
        if(response && response.error) {
          alert("There was an error syncing. Please try again. If all else fails, log out and log back in.");
        } else {
          this.syncUpdated();
        }
      }.bind(this));
    }

    this.syncUpdated = function() {
      this.lastSyncDate = new Date();
    }

    $rootScope.$on("new-update-available", function(version){
      $timeout(function(){
        // timeout calls apply() which is needed
        this.onNewUpdateAvailable();
      }.bind(this))
    }.bind(this))

    this.onNewUpdateAvailable = function() {
      this.newUpdateAvailable = true;
    }

    this.clickedNewUpdateAnnouncement = function() {
      this.newUpdateAvailable = false;
      alert("A new update is ready to install. Updates address performance and security issues, as well as bug fixes and feature enhancements. Simply quit Standard Notes and re-open it for the update to be applied.")
    }


    /* Rooms */

    this.componentManager = componentManager;
    this.rooms = [];

    modelManager.addItemSyncObserver("room-bar", "SN|Component", (allItems, validItems, deletedItems, source) => {
      this.rooms = _.uniq(this.rooms.concat(allItems.filter((candidate) => {return candidate.area == "rooms"})))
        .filter((candidate) => {return !candidate.deleted});
    });

    componentManager.registerHandler({identifier: "roomBar", areas: ["rooms"], activationHandler: (component) => {
      if(component.active) {
        $timeout(() => {
          var iframe = componentManager.iframeForComponent(component);
          if(iframe) {
            var lastSize = component.getRoomLastSize();
            if(lastSize) {
              componentManager.handleSetSizeEvent(component, lastSize);
            }
            iframe.onload = function() {
              componentManager.registerComponentWindow(component, iframe.contentWindow);
            }.bind(this);
          }
        });
      }
    }, actionHandler: (component, action, data) => {
      if(action == "set-size") {
        componentManager.handleSetSizeEvent(component, data);
        component.setRoomLastSize(data);
      }
    }});

    this.selectRoom = function(room) {
      room.show = !room.show;
      if(room.show) {
        this.componentManager.activateComponent(room);
      } else {
        this.hideRoom(room);
      }
    }

    this.hideRoom = function(room) {
      room.show = false;
      this.componentManager.deactivateComponent(room);
    }

    // Handle singleton ProLink instance
    singletonManager.registerSingleton({content_type: "SN|Component", package_info: {identifier: "org.standardnotes.prolink"}}, (resolvedSingleton) => {
      console.log("Roombar received resolved ProLink", resolvedSingleton);
    }, (valueCallback) => {
      console.log("Creating prolink");
      // Safe to create. Create and return object.
      let url = window._prolink_package_url;
      packageManager.installPackage(url, (component) => {
        valueCallback(component);
      })
    });
});
