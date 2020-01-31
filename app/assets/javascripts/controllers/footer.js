import { PrivilegesManager } from '@/services/privilegesManager';
import { dateToLocalizedString } from '@/utils';
import template from '%/footer.pug';
import {
  APP_STATE_EVENT_EDITOR_FOCUSED,
  APP_STATE_EVENT_BEGAN_BACKUP_DOWNLOAD,
  APP_STATE_EVENT_ENDED_BACKUP_DOWNLOAD,
  EVENT_SOURCE_USER_INTERACTION
} from '@/state';
import {
  STRING_GENERIC_SYNC_ERROR,
  STRING_NEW_UPDATE_READY
} from '@/strings';

class FooterCtrl {

  /* @ngInject */
  constructor(
    $rootScope,
    $timeout,
    alertManager,
    appState,
    authManager,
    componentManager,
    modelManager,
    nativeExtManager,
    passcodeManager,
    privilegesManager,
    statusManager,
    syncManager,
  ) {
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.alertManager = alertManager;
    this.appState = appState;
    this.authManager = authManager;
    this.componentManager = componentManager;
    this.modelManager = modelManager;
    this.nativeExtManager = nativeExtManager;
    this.passcodeManager = passcodeManager;
    this.privilegesManager = privilegesManager;
    this.statusManager = statusManager;
    this.syncManager = syncManager;

    this.rooms = [];
    this.themesWithIcons = [];
    this.showSyncResolution = false;

    this.addAppStateObserver();
    this.updateOfflineStatus();
    this.addSyncEventHandler();
    this.findErrors();
    this.registerMappingObservers();
    this.registerComponentHandler();
    this.addRootScopeListeners();

    this.authManager.checkForSecurityUpdate().then((available) => {
      this.securityUpdateAvailable = available;
    });
    this.statusManager.addStatusObserver((string) => {
      this.$timeout(() => {
        this.arbitraryStatusMessage = string;
      });
    });
  }

  addRootScopeListeners() {
    this.$rootScope.$on("security-update-status-changed", () => {
      this.securityUpdateAvailable = this.authManager.securityUpdateAvailable;
    });
    this.$rootScope.$on("reload-ext-data", () => {
      this.reloadExtendedData();
    });
    this.$rootScope.$on("new-update-available", () => {
      this.$timeout(() => {
        this.onNewUpdateAvailable();
      });
    });
  }

  addAppStateObserver() {
    this.appState.addObserver((eventName, data) => {
      if(eventName === APP_STATE_EVENT_EDITOR_FOCUSED) {
        if (data.eventSource === EVENT_SOURCE_USER_INTERACTION) {
          this.closeAllRooms();
          this.closeAccountMenu();
        }
      } else if(eventName === APP_STATE_EVENT_BEGAN_BACKUP_DOWNLOAD) {
        this.backupStatus = this.statusManager.addStatusFromString(
          "Saving local backup..."
        );
      } else if(eventName === APP_STATE_EVENT_ENDED_BACKUP_DOWNLOAD) {
        if(data.success) {
          this.backupStatus = this.statusManager.replaceStatusWithString(
            this.backupStatus,
            "Successfully saved backup."
          );
        } else {
          this.backupStatus = this.statusManager.replaceStatusWithString(
            this.backupStatus,
            "Unable to save local backup."
          );
        }
        this.$timeout(() => {
          this.backupStatus = this.statusManager.removeStatus(this.backupStatus);
        }, 2000);
      }
    });
  }

  addSyncEventHandler() {
    this.syncManager.addEventHandler((syncEvent, data) => {
      this.$timeout(() => {
        if(syncEvent === "local-data-loaded") {
          if(this.offline && this.modelManager.noteCount() === 0) {
            this.showAccountMenu = true;
          }
        } else if(syncEvent === "enter-out-of-sync") {
          this.outOfSync = true;
        } else if(syncEvent === "exit-out-of-sync") {
          this.outOfSync = false;
        } else if(syncEvent === 'sync:completed') {
          this.syncUpdated();
          this.findErrors();
          this.updateOfflineStatus();
        } else if(syncEvent === 'sync:error') {
          this.findErrors();
          this.updateOfflineStatus();
        }
      })
    });
  }

  registerMappingObservers() {
    this.modelManager.addItemSyncObserver(
      'room-bar',
      'SN|Component',
      (allItems, validItems, deletedItems, source) => {
        this.rooms = this.modelManager.components.filter((candidate) => {
          return candidate.area === 'rooms' && !candidate.deleted
        });
        if(this.queueExtReload) {
          this.queueExtReload = false;
          this.reloadExtendedData();
        }
      }
    );

    this.modelManager.addItemSyncObserver(
      'footer-bar-themes',
      'SN|Theme',
      (allItems, validItems, deletedItems, source) => {
        const themes = this.modelManager.validItemsForContentType('SN|Theme')
        .filter((candidate) => {
          return (
            !candidate.deleted &&
            candidate.content.package_info &&
            candidate.content.package_info.dock_icon
          );
        }).sort((a, b) => {
          return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
        });
        const differ = themes.length !== this.themesWithIcons.length;
        this.themesWithIcons = themes;
        if(differ) {
          this.reloadDockShortcuts();
        }
      }
    );
  }

  registerComponentHandler() {
    this.componentManager.registerHandler({
      identifier: "roomBar",
      areas: ["rooms", "modal"],
      activationHandler: (component) => {},
      actionHandler: (component, action, data) => {
        if(action === "set-size") {
          component.setLastSize(data);
        }
      },
      focusHandler: (component, focused) => {
        if(component.isEditor() && focused) {
          this.closeAllRooms();
          this.closeAccountMenu();
        }
      }
    });
  }

  reloadExtendedData() {
    if(this.reloadInProgress) {
      return;
    }
    this.reloadInProgress = true;

    /**
     * A reload consists of opening the extensions manager,
     * then closing it after a short delay.
     */
    const extWindow = this.rooms.find((room) => {
      return room.package_info.identifier === this.nativeExtManager.extManagerId;
    });
    if(!extWindow) {
      this.queueExtReload = true;
      this.reloadInProgress = false;
      return;
    }
    this.selectRoom(extWindow);
    this.$timeout(() => {
      this.selectRoom(extWindow);
      this.reloadInProgress = false;
      this.$rootScope.$broadcast('ext-reload-complete');
    }, 2000);
  }

  getUser() {
    return this.authManager.user;
  }

  updateOfflineStatus() {
    this.offline = this.authManager.offline();
  }

  openSecurityUpdate() {
    this.authManager.presentPasswordWizard('upgrade-security');
  }

  findErrors() {
    this.error = this.syncManager.syncStatus.error;
  }

  accountMenuPressed() {
    this.showAccountMenu = !this.showAccountMenu;
    this.closeAllRooms();
  }

  toggleSyncResolutionMenu = () => {
    this.showSyncResolution = !this.showSyncResolution;
  }

  closeAccountMenu = () => {
    this.showAccountMenu = false;
  }

  hasPasscode() {
    return this.passcodeManager.hasPasscode();
  }

  lockApp() {
    this.$rootScope.lockApplication();
  }

  refreshData() {
    this.isRefreshing = true;
    this.syncManager.sync({
      force: true,
      performIntegrityCheck: true
    }).then((response) => {
      this.$timeout(() => {
        this.isRefreshing = false;
      }, 200)
      if(response && response.error) {
        this.alertManager.alert({
          text: STRING_GENERIC_SYNC_ERROR
        });
      } else {
        this.syncUpdated();
      }
    });
  }

  syncUpdated() {
    this.lastSyncDate = dateToLocalizedString(new Date());
  }

  onNewUpdateAvailable() {
    this.newUpdateAvailable = true;
  }

  clickedNewUpdateAnnouncement() {
    this.newUpdateAvailable = false;
    this.alertManager.alert({
      text: STRING_NEW_UPDATE_READY
    })
  }

  reloadDockShortcuts() {
    const shortcuts = [];
    for(const theme of this.themesWithIcons) {
      const name = theme.content.package_info.name;
      const icon = theme.content.package_info.dock_icon;
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
      /** Circles first, then images */
      const aType = a.icon.type;
      const bType = b.icon.type;
      if(aType === bType) {
        return 0;
      } else if(aType === 'circle' && bType === 'svg') {
        return -1;
      } else if(bType === 'circle' && aType === 'svg') {
        return 1;
      }
    });
  }

  initSvgForShortcut(shortcut) {
    const id = 'dock-svg-' + shortcut.component.uuid;
    const element = document.getElementById(id);
    const parser = new DOMParser();
    const svg = shortcut.component.content.package_info.dock_icon.source;
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    element.appendChild(doc.documentElement);
  }

  selectShortcut(shortcut) {
    this.componentManager.toggleComponent(shortcut.component);
  }

  onRoomDismiss(room) {
    room.showRoom = false;
  }

  closeAllRooms() {
    for(const room of this.rooms) {
      room.showRoom = false;
    }
  }

  async selectRoom(room) {
    const run = () => {
      this.$timeout(() => {
        room.showRoom = !room.showRoom;
      })
    }

    if(!room.showRoom) {
      const requiresPrivilege = await this.privilegesManager.actionRequiresPrivilege(
        PrivilegesManager.ActionManageExtensions
      );
      if(requiresPrivilege) {
        this.privilegesManager.presentPrivilegesModal(
          PrivilegesManager.ActionManageExtensions,
          run
        );
      } else {
        run();
      }
    } else {
      run();
    }
  }

  clickOutsideAccountMenu() {
    if(this.privilegesManager.authenticationInProgress()) {
      return;
    }
    this.showAccountMenu = false;
  }
}

export class Footer {
  constructor() {
    this.restrict = 'E';
    this.scope = {};
    this.template = template;
    this.controller = FooterCtrl;
    this.replace = true;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
  }
}
