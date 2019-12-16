import { PrivilegesManager } from '@/services/privilegesManager';
import template from '%/footer.pug';

export class Footer {
  constructor() {
    this.restrict = 'E';
    this.scope = {};
    this.template = template;
    this.replace = true;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
  }

  link(scope, elem, attrs, ctrl) {
    scope.$on('sync:completed', function() {
      ctrl.syncUpdated();
      ctrl.findErrors();
      ctrl.updateOfflineStatus();
    });
    scope.$on('sync:error', function() {
      ctrl.findErrors();
      ctrl.updateOfflineStatus();
    });
  }

  /* @ngInject */
  controller(
    $rootScope,
    authManager,
    modelManager,
    $timeout,
    dbManager,
    syncManager,
    storageManager,
    passcodeManager,
    componentManager,
    singletonManager,
    nativeExtManager,
    privilegesManager,
    statusManager,
    alertManager
  ) {
    authManager.checkForSecurityUpdate().then((available) => {
      this.securityUpdateAvailable = available;
    })

    $rootScope.$on("security-update-status-changed", () => {
      this.securityUpdateAvailable = authManager.securityUpdateAvailable;
    })

    statusManager.addStatusObserver((string) => {
      $timeout(() => {
        this.arbitraryStatusMessage = string;
      })
    })

    $rootScope.$on("did-begin-local-backup", () => {
      $timeout(() => {
        this.backupStatus = statusManager.addStatusFromString("Saving local backup...");
      })
    });

    $rootScope.$on("did-finish-local-backup", (event, data) => {
      $timeout(() => {
        if(data.success) {
          this.backupStatus = statusManager.replaceStatusWithString(this.backupStatus, "Successfully saved backup.");
        } else {
          this.backupStatus = statusManager.replaceStatusWithString(this.backupStatus, "Unable to save local backup.");
        }

        $timeout(() => {
          this.backupStatus = statusManager.removeStatus(this.backupStatus);
        }, 2000)
      })
    });

    this.openSecurityUpdate = function() {
      authManager.presentPasswordWizard("upgrade-security");
    }

    $rootScope.$on("reload-ext-data", () => {
      this.reloadExtendedData();
    });

    this.reloadExtendedData = () => {
      if(this.reloadInProgress) { return; }
      this.reloadInProgress = true;

      // A reload occurs when the extensions manager window is opened. We can close it after a delay
      let extWindow = this.rooms.find((room) => {return room.package_info.identifier == nativeExtManager.extensionsManagerIdentifier});
      if(!extWindow) {
        this.queueExtReload = true; // try again when the ext is available
        this.reloadInProgress = false;
        return;
      }

      this.selectRoom(extWindow);

      $timeout(() => {
        this.selectRoom(extWindow);
        this.reloadInProgress = false;
        $rootScope.$broadcast("ext-reload-complete");
      }, 2000);
    }

    this.getUser = function() {
      return authManager.user;
    }

    this.updateOfflineStatus = function() {
      this.offline = authManager.offline();
    }
    this.updateOfflineStatus();


    syncManager.addEventHandler((syncEvent, data) => {
      $timeout(() => {
        if(syncEvent == "local-data-loaded") {
          // If the user has no notes and is offline, show Account menu
          if(this.offline && modelManager.noteCount() == 0) {
            this.showAccountMenu = true;
          }
        } else if(syncEvent == "enter-out-of-sync") {
          this.outOfSync = true;
        } else if(syncEvent == "exit-out-of-sync") {
          this.outOfSync = false;
        }
      })
    });

    this.findErrors = function() {
      this.error = syncManager.syncStatus.error;
    }
    this.findErrors();

    this.onAuthSuccess = function() {
      this.showAccountMenu = false;
    }.bind(this)

    this.accountMenuPressed = function() {
      this.showAccountMenu = !this.showAccountMenu;
      this.closeAllRooms();
    }

    this.toggleSyncResolutionMenu = function() {
      this.showSyncResolution = !this.showSyncResolution;
    }.bind(this);

    this.closeAccountMenu = () => {
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
      // Enable integrity checking for this force request
      syncManager.sync({force: true, performIntegrityCheck: true}).then((response) => {
        $timeout(function(){
          this.isRefreshing = false;
        }.bind(this), 200)
        if(response && response.error) {
          alertManager.alert({text: "There was an error syncing. Please try again. If all else fails, try signing out and signing back in."});
        } else {
          this.syncUpdated();
        }
      });
    }

    this.syncUpdated = function() {
      this.lastSyncDate = new Date();
    }

    $rootScope.$on("new-update-available", () => {
      $timeout(() => {
        this.onNewUpdateAvailable();
      })
    })

    this.onNewUpdateAvailable = function() {
      this.newUpdateAvailable = true;
    }

    this.clickedNewUpdateAnnouncement = function() {
      this.newUpdateAvailable = false;
      alertManager.alert({text: "A new update is ready to install. Please use the top-level 'Updates' menu to manage installation."})
    }


    /* Rooms */

    this.componentManager = componentManager;
    this.rooms = [];
    this.themesWithIcons = [];

    modelManager.addItemSyncObserver("room-bar", "SN|Component", (allItems, validItems, deletedItems, source) => {
      this.rooms = modelManager.components.filter((candidate) => {return candidate.area == "rooms" && !candidate.deleted});
      if(this.queueExtReload) {
        this.queueExtReload = false;
        this.reloadExtendedData();
      }
    });

    modelManager.addItemSyncObserver("footer-bar-themes", "SN|Theme", (allItems, validItems, deletedItems, source) => {
      let themes = modelManager.validItemsForContentType("SN|Theme").filter((candidate) => {
        return !candidate.deleted && candidate.content.package_info && candidate.content.package_info.dock_icon;
      }).sort((a, b) => {
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
      });

      let differ = themes.length != this.themesWithIcons.length;

      this.themesWithIcons = themes;

      if(differ) {
        this.reloadDockShortcuts();
      }
    });

    this.reloadDockShortcuts = function() {
      let shortcuts = [];
      for(var theme of this.themesWithIcons) {
        var name = theme.content.package_info.name;
        var icon = theme.content.package_info.dock_icon;
        if(!icon) {
          continue;
        }
        shortcuts.push({
          name: name,
          component: theme,
          icon: icon
        })
      }

      this.dockShortcuts = shortcuts.sort((a, b) => {
        // circles first, then images

        var aType = a.icon.type;
        var bType = b.icon.type;

        if(aType == bType) {
          return 0;
        } else if(aType == "circle" && bType == "svg") {
          return -1;
        } else if(bType == "circle" && aType == "svg") {
          return 1;
        }
      });
    }

    this.initSvgForShortcut = function(shortcut) {
      var id = "dock-svg-" + shortcut.component.uuid;
      var element = document.getElementById(id);
      var parser = new DOMParser();
      var svg = shortcut.component.content.package_info.dock_icon.source;
      var doc = parser.parseFromString(svg, "image/svg+xml");
      element.appendChild(doc.documentElement);
    }

    this.selectShortcut = function(shortcut) {
      componentManager.toggleComponent(shortcut.component);
    }

    componentManager.registerHandler({identifier: "roomBar", areas: ["rooms", "modal"], activationHandler: (component) => {
      // RIP: There used to be code here that checked if component.active was true, and if so, displayed the component.
      // However, we no longer want to persist active state for footer extensions. If you open Extensions on one computer,
      // it shouldn't open on another computer. Active state should only be persisted for persistent extensions, like Folders.
    }, actionHandler: (component, action, data) => {
      if(action == "set-size") {
        component.setLastSize(data);
      }
    }, focusHandler: (component, focused) => {
      if(component.isEditor() && focused) {
        this.closeAllRooms();
        this.closeAccountMenu();
      }
    }});

    $rootScope.$on("editorFocused", () => {
      this.closeAllRooms();
      this.closeAccountMenu();
    })

    this.onRoomDismiss = function(room) {
      room.showRoom = false;
    }

    this.closeAllRooms = function() {
      for(var room of this.rooms) {
        room.showRoom = false;
      }
    }

    this.selectRoom = async function(room) {
      let run = () => {
        $timeout(() => {
          room.showRoom = !room.showRoom;
        })
      }

      if(!room.showRoom) {
        // About to show, check if has privileges
        if(await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionManageExtensions)) {
          privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionManageExtensions, () => {
            run();
          });
        } else {
          run();
        }
      } else {
        run();
      }
    }

    this.clickOutsideAccountMenu = function() {
      if(privilegesManager.authenticationInProgress()) {
        return;
      }
      this.showAccountMenu = false;
    }
  }
}
