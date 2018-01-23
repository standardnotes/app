angular.module('app')
  .directive("footer", function(authManager){
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'footer.html',
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
    syncManager, storageManager, passcodeManager, componentManager, singletonManager, packageManager) {

    this.getUser = function() {
      return authManager.user;
    }

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

    this.closeAccountMenu = () => {
      this.showAccountMenu = false;
    }

    this.accountMenuPressed = function() {
      this.showAccountMenu = !this.showAccountMenu;
    }

    this.toggleExtensions = function() {
      this.showExtensionsMenu = !this.showExtensionsMenu;
    }

    this.hasPasscode = function() {
      return passcodeManager.hasPasscode();
    }

    this.lockApp = function() {
      $rootScope.lockApplication();
    }

    this.refreshData = function() {
      this.isRefreshing = true;
      syncManager.sync((response) => {
        $timeout(function(){
          this.isRefreshing = false;
        }.bind(this), 200)
        if(response && response.error) {
          alert("There was an error syncing. Please try again. If all else fails, log out and log back in.");
        } else {
          this.syncUpdated();
        }
      }, null, "refreshData");
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
      var incomingRooms = allItems.filter((candidate) => {return candidate.area == "rooms"});
      this.rooms = _.uniq(this.rooms.concat(incomingRooms)).filter((candidate) => {return !candidate.deleted});
    });

    componentManager.registerHandler({identifier: "roomBar", areas: ["rooms", "modal"], activationHandler: (component) => {
      if(component.active) {
        // Show room, if it was not activated manually (in the event of event from componentManager)
        if(component.area == "rooms" && !component.showRoom) {
          this.selectRoom(component);
        }
        $timeout(() => {
          var lastSize = component.getLastSize();
          if(lastSize) {
            componentManager.handleSetSizeEvent(component, lastSize);
          }
        });
      }
    }, actionHandler: (component, action, data) => {
      if(action == "set-size") {
        component.setLastSize(data);
      }
    }});

    this.selectRoom = function(room) {

      // Allows us to send messages to component modal directive
      if(!room.directiveController) {
        room.directiveController = {onDismiss: () => {
          room.showRoom = false;
        }};
      }

      // Make sure to call dismiss() before setting new showRoom value
      // This way the directive stays alive long enough to deactivate the associated component
      // (The directive's life is at the mercy of "ng-if" => "room.showRoom")
      if(room.showRoom) {
        room.directiveController.dismiss(() => {

        });
      } else {
        room.showRoom = true;
      }
    }
});
