import { dateToLocalizedString } from '@/utils';
import {
  ApplicationEvent,
  TIMING_STRATEGY_FORCE_SPAWN_NEW,
  ProtectedAction,
  ContentTypes
} from 'snjs';
import template from '%/footer.pug';
import { AppStateEvent, EventSource } from '@/services/state';
import {
  STRING_GENERIC_SYNC_ERROR,
  STRING_NEW_UPDATE_READY
} from '@/strings';
import { PureCtrl } from '@Controllers';

class FooterCtrl extends PureCtrl {

  /* @ngInject */
  constructor(
    $rootScope,
    $timeout,
  ) {
    super($timeout);
    this.$rootScope = $rootScope;
    this.rooms = [];
    this.themesWithIcons = [];
    this.showSyncResolution = false;
    this.addRootScopeListeners();
  }

  deinit() {
    this.rooms.length = 0;
    this.themesWithIcons.length = 0;
    this.unregisterComponent();
    this.unregisterComponent = null;
    this.rootScopeListener1();
    this.rootScopeListener2();
    this.rootScopeListener1 = null;
    this.rootScopeListener2 = null;
    this.closeAccountMenu = null;
    this.toggleSyncResolutionMenu = null;
    super.deinit();
  }

  $onInit() {
    super.$onInit();
    this.application.getStatusService().addStatusObserver((string) => {
      this.$timeout(() => {
        this.arbitraryStatusMessage = string;
      });
    });
  }

  getInitialState() {
    return {
      hasPasscode: false
    };
  }

  reloadUpgradeStatus() {
    this.application.checkForSecurityUpdate().then((available) => {
      this.setState({
        dataUpgradeAvailable: available
      });
    });
  }

  onAppLaunch() {
    super.onAppLaunch();
    this.reloadPasscodeStatus();
    this.reloadUpgradeStatus();
    this.user = this.application.getUser();
    this.updateOfflineStatus();
    this.findErrors();
    this.streamItems();
    this.registerComponentHandler();
  }

  async reloadPasscodeStatus() {
    const hasPasscode = this.application.hasPasscode();
    this.setState({
      hasPasscode: hasPasscode
    });
  }

  addRootScopeListeners() {
    this.rootScopeListener1 = this.$rootScope.$on("reload-ext-data", () => {
      this.reloadExtendedData();
    });
    this.rootScopeListener2 = this.$rootScope.$on("new-update-available", () => {
      this.$timeout(() => {
        this.onNewUpdateAvailable();
      });
    });
  }

  /** @override */
  onAppStateEvent(eventName, data) {
    if (eventName === AppStateEvent.EditorFocused) {
      if (data.eventSource === EventSource.UserInteraction) {
        this.closeAllRooms();
        this.closeAccountMenu();
      }
    } else if (eventName === AppStateEvent.BeganBackupDownload) {
      this.backupStatus = this.application.getStatusService().addStatusFromString(
        "Saving local backup..."
      );
    } else if (eventName === AppStateEvent.EndedBackupDownload) {
      if (data.success) {
        this.backupStatus = this.application.getStatusService().replaceStatusWithString(
          this.backupStatus,
          "Successfully saved backup."
        );
      } else {
        this.backupStatus = this.application.getStatusService().replaceStatusWithString(
          this.backupStatus,
          "Unable to save local backup."
        );
      }
      this.$timeout(() => {
        this.backupStatus = this.application.getStatusService().removeStatus(this.backupStatus);
      }, 2000);
    }
  }

  /** @override */
  async onAppKeyChange() {
    super.onAppKeyChange();
    this.reloadPasscodeStatus();
  }


  /** @override */
  onAppEvent(eventName) {
    if (eventName === ApplicationEvent.KeyStatusChanged) {
      this.reloadUpgradeStatus();
    } else if (eventName === ApplicationEvent.EnteredOutOfSync) {
      this.setState({
        outOfSync: true
      });
    } else if (eventName === ApplicationEvent.ExitedOutOfSync) {
      this.setState({
        outOfSync: false
      });
    } else if (eventName === ApplicationEvent.CompletedSync) {
      if (this.offline && this.application.getNoteCount() === 0) {
        this.showAccountMenu = true;
      }
      this.syncUpdated();
      this.findErrors();
      this.updateOfflineStatus();
    } else if (eventName === ApplicationEvent.FailedSync) {
      this.findErrors();
      this.updateOfflineStatus();
    }
  }

  streamItems() {
    this.application.streamItems({
      contentType: ContentType.Component,
      stream: async () => {
        this.rooms = this.application.getItems({
          contentType: ContentType.Component
        }).filter((candidate) => {
          return candidate.area === 'rooms' && !candidate.deleted;
        });
        if (this.queueExtReload) {
          this.queueExtReload = false;
          this.reloadExtendedData();
        }
      }
    });

    this.application.streamItems({
      contentType: 'SN|Theme',
      stream: async () => {
        const themes = this.application.getDisplayableItems({
          contentType: ContentType.Theme
        }).filter((candidate) => {
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
        if (differ) {
          this.reloadDockShortcuts();
        }
      }
    });
  }

  registerComponentHandler() {
    this.unregisterComponent = this.application.componentManager.registerHandler({
      identifier: "roomBar",
      areas: ["rooms", "modal"],
      activationHandler: (component) => { },
      actionHandler: (component, action, data) => {
        if (action === "set-size") {
          component.setLastSize(data);
        }
      },
      focusHandler: (component, focused) => {
        if (component.isEditor() && focused) {
          this.closeAllRooms();
          this.closeAccountMenu();
        }
      }
    });
  }

  reloadExtendedData() {
    if (this.reloadInProgress) {
      return;
    }
    this.reloadInProgress = true;

    /**
     * A reload consists of opening the extensions manager,
     * then closing it after a short delay.
     */
    const extWindow = this.rooms.find((room) => {
      return room.package_info.identifier === this.application.getNativeExtService().extManagerId;
    });
    if (!extWindow) {
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

  updateOfflineStatus() {
    this.offline = this.application.noAccount();
  }

  openSecurityUpdate() {
    this.application.performProtocolUpgrade();
  }

  findErrors() {
    this.error = this.application.getSyncStatus().error;
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

  lockApp() {
    this.application.lock();
  }

  refreshData() {
    this.isRefreshing = true;
    this.application.sync({
      timingStrategy: TIMING_STRATEGY_FORCE_SPAWN_NEW,
      checkIntegrity: true
    }).then((response) => {
      this.$timeout(() => {
        this.isRefreshing = false;
      }, 200);
      if (response && response.error) {
        this.application.alertService.alert({
          text: STRING_GENERIC_SYNC_ERROR
        });
      } else {
        this.syncUpdated();
      }
    });
  }

  syncUpdated() {
    this.lastSyncDate = dateToLocalizedString(this.application.getLastSyncDate());
  }

  onNewUpdateAvailable() {
    this.newUpdateAvailable = true;
  }

  clickedNewUpdateAnnouncement() {
    this.newUpdateAvailable = false;
    this.application.alertService.alert({
      text: STRING_NEW_UPDATE_READY
    });
  }

  reloadDockShortcuts() {
    const shortcuts = [];
    for (const theme of this.themesWithIcons) {
      const name = theme.content.package_info.name;
      const icon = theme.content.package_info.dock_icon;
      if (!icon) {
        continue;
      }
      shortcuts.push({
        name: name,
        component: theme,
        icon: icon
      });
    }

    this.dockShortcuts = shortcuts.sort((a, b) => {
      /** Circles first, then images */
      const aType = a.icon.type;
      const bType = b.icon.type;
      if (aType === bType) {
        return 0;
      } else if (aType === 'circle' && bType === 'svg') {
        return -1;
      } else if (bType === 'circle' && aType === 'svg') {
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
    this.application.componentManager.toggleComponent(shortcut.component);
  }

  onRoomDismiss(room) {
    room.showRoom = false;
  }

  closeAllRooms() {
    for (const room of this.rooms) {
      room.showRoom = false;
    }
  }

  async selectRoom(room) {
    const run = () => {
      this.$timeout(() => {
        room.showRoom = !room.showRoom;
      });
    };

    if (!room.showRoom) {
      const requiresPrivilege = await this.application.privilegesService.actionRequiresPrivilege(
        ProtectedAction.ManageExtensions
      );
      if (requiresPrivilege) {
        this.application.presentPrivilegesModal(
          ProtectedAction.ManageExtensions,
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
    if (this.application && this.application.authenticationInProgress()) {
      return;
    }
    this.showAccountMenu = false;
  }
}

export class Footer {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = FooterCtrl;
    this.replace = true;
    this.controllerAs = 'ctrl';
    this.bindToController = {
      application: '='
    };
  }
}
