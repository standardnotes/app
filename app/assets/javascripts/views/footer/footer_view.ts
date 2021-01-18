import { RootScopeMessages } from './../../messages';
import { ApplicationGroup } from '@/ui_models/application_group';
import { WebDirective } from '@/types';
import { dateToLocalizedString, preventRefreshing } from '@/utils';
import {
  ApplicationEvent,
  SyncQueueStrategy,
  ContentType,
  SNComponent,
  SNTheme,
  ComponentArea,
  CollectionSort,
} from '@standardnotes/snjs';
import template from './footer-view.pug';
import { AppStateEvent, EventSource } from '@/ui_models/app_state';
import {
  STRING_GENERIC_SYNC_ERROR,
  STRING_NEW_UPDATE_READY,
  STRING_CONFIRM_APP_QUIT_DURING_UPGRADE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
} from '@/strings';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { alertDialog, confirmDialog } from '@/services/alertService';
import { autorun, IReactionDisposer } from 'mobx';

/**
 * Disable before production release.
 * Anyone who used the beta will still have access to
 * the account switcher in production via local storage flag
 */
const ACCOUNT_SWITCHER_ENABLED = false;
const ACCOUNT_SWITCHER_FEATURE_KEY = 'account_switcher';

type DockShortcut = {
  name: string,
  component: SNComponent,
  icon: {
    type: string
    background_color: string
    border_color: string
  }
}

class FooterViewCtrl extends PureViewCtrl<unknown, {
  outOfSync: boolean;
  hasPasscode: boolean;
  dataUpgradeAvailable: boolean;
  dockShortcuts: DockShortcut[];
  hasAccountSwitcher: boolean;
  showBetaWarning: boolean;
  showDataUpgrade: boolean;
}> {
  private $rootScope: ng.IRootScopeService
  private rooms: SNComponent[] = []
  private themesWithIcons: SNTheme[] = []
  private showSyncResolution = false
  private unregisterComponent: any
  private rootScopeListener1: any
  private rootScopeListener2: any
  public arbitraryStatusMessage?: string
  public user?: any
  private offline = true
  private showAccountMenu = false
  private didCheckForOffline = false
  private queueExtReload = false
  private reloadInProgress = false
  public hasError = false
  public isRefreshing = false
  public lastSyncDate?: string
  public newUpdateAvailable = false
  public dockShortcuts: DockShortcut[] = []
  public roomShowState: Partial<Record<string, boolean>> = {}
  private observerRemovers: Array<() => void> = [];
  private completedInitialSync = false;
  private showingDownloadStatus = false;
  private removeBetaWarningListener?: IReactionDisposer;

  /* @ngInject */
  constructor(
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    private mainApplicationGroup: ApplicationGroup
  ) {
    super($timeout);
    this.$rootScope = $rootScope;
    this.addRootScopeListeners();
    this.toggleSyncResolutionMenu = this.toggleSyncResolutionMenu.bind(this);
    this.closeAccountMenu = this.closeAccountMenu.bind(this);
  }

  deinit() {
    for (const remove of this.observerRemovers) remove();
    this.observerRemovers.length = 0;
    this.rooms.length = 0;
    this.themesWithIcons.length = 0;
    this.unregisterComponent();
    this.unregisterComponent = undefined;
    this.rootScopeListener1();
    this.rootScopeListener2();
    this.rootScopeListener1 = undefined;
    this.rootScopeListener2 = undefined;
    (this.closeAccountMenu as any) = undefined;
    (this.toggleSyncResolutionMenu as any) = undefined;
    this.removeBetaWarningListener?.();
    super.deinit();
  }

  $onInit() {
    super.$onInit();
    this.application.getStatusManager().onStatusChange((message) => {
      this.$timeout(() => {
        this.arbitraryStatusMessage = message;
      });
    });
    this.loadAccountSwitcherState();
    this.removeBetaWarningListener = autorun(() => {
      const showBetaWarning = this.appState.showBetaWarning;
      this.setState({
        showBetaWarning: showBetaWarning,
        showDataUpgrade: !showBetaWarning
      });
    });
  }

  loadAccountSwitcherState() {
    const stringValue = localStorage.getItem(ACCOUNT_SWITCHER_FEATURE_KEY);
    if (!stringValue && ACCOUNT_SWITCHER_ENABLED) {
      /** Enable permanently for this user so they don't lose the feature after its disabled */
      localStorage.setItem(ACCOUNT_SWITCHER_FEATURE_KEY, JSON.stringify(true));
    }
    const hasAccountSwitcher = stringValue ? JSON.parse(stringValue) : ACCOUNT_SWITCHER_ENABLED;
    this.setState({ hasAccountSwitcher });
  }

  getInitialState() {
    return {
      outOfSync: false,
      dataUpgradeAvailable: false,
      hasPasscode: false,
      dockShortcuts: [],
      descriptors: this.mainApplicationGroup.getDescriptors(),
      hasAccountSwitcher: false,
      showBetaWarning: false,
      showDataUpgrade: false,
    };
  }

  reloadUpgradeStatus() {
    this.application.checkForSecurityUpdate().then((available) => {
      this.setState({
        dataUpgradeAvailable: available
      });
    });
  }

  /** @template */
  openAccountSwitcher() {
    this.application.openAccountSwitcher();
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.reloadPasscodeStatus();
    this.reloadUser();
    this.reloadUpgradeStatus();
    this.updateOfflineStatus();
    this.findErrors();
    this.streamItems();
    this.registerComponentHandler();
  }

  reloadUser() {
    this.user = this.application.getUser();
  }

  async reloadPasscodeStatus() {
    const hasPasscode = this.application.hasPasscode();
    this.setState({
      hasPasscode: hasPasscode
    });
  }

  addRootScopeListeners() {
    this.rootScopeListener1 = this.$rootScope.$on(RootScopeMessages.ReloadExtendedData, () => {
      this.reloadExtendedData();
    });
    this.rootScopeListener2 = this.$rootScope.$on(RootScopeMessages.NewUpdateAvailable, () => {
      this.$timeout(() => {
        this.onNewUpdateAvailable();
      });
    });
  }

  /** @override */
  onAppStateEvent(eventName: AppStateEvent, data: any) {
    const statusService = this.application.getStatusManager();
    switch (eventName) {
      case AppStateEvent.EditorFocused:
        if (data.eventSource === EventSource.UserInteraction) {
          this.closeAllRooms();
          this.closeAccountMenu();
        }
        break;
      case AppStateEvent.BeganBackupDownload:
        statusService.setMessage("Saving local backup…");
        break;
      case AppStateEvent.EndedBackupDownload: {
        const successMessage = "Successfully saved backup.";
        const errorMessage = "Unable to save local backup."
        statusService.setMessage(data.success ? successMessage : errorMessage);

        const twoSeconds = 2000;
        this.$timeout(() => {
          if (
            statusService.message === successMessage ||
            statusService.message === errorMessage
          ) {
            statusService.setMessage('');
          }
        }, twoSeconds);
        break;
      }
    }
  }

  /** @override */
  async onAppKeyChange() {
    super.onAppKeyChange();
    this.reloadPasscodeStatus();
  }

  /** @override */
  onAppEvent(eventName: ApplicationEvent) {
    switch (eventName) {
      case ApplicationEvent.KeyStatusChanged:
        this.reloadUpgradeStatus();
        break;
      case ApplicationEvent.EnteredOutOfSync:
        this.setState({
          outOfSync: true
        });
        break;
      case ApplicationEvent.ExitedOutOfSync:
        this.setState({
          outOfSync: false
        });
        break;
      case ApplicationEvent.CompletedFullSync:
        if (!this.completedInitialSync) {
          this.application.getStatusManager().setMessage('');
          this.completedInitialSync = true;
        }
        if (!this.didCheckForOffline) {
          this.didCheckForOffline = true;
          if (this.offline && this.application.getNoteCount() === 0) {
            this.showAccountMenu = true;
          }
        }
        this.syncUpdated();
        this.findErrors();
        this.updateOfflineStatus();
        break;
      case ApplicationEvent.SyncStatusChanged:
        this.updateSyncStatus();
        break;
      case ApplicationEvent.FailedSync:
        this.updateSyncStatus();
        this.findErrors();
        this.updateOfflineStatus();
        break;
      case ApplicationEvent.LocalDataIncrementalLoad:
      case ApplicationEvent.LocalDataLoaded:
        this.updateLocalDataStatus();
        break;
      case ApplicationEvent.SignedIn:
      case ApplicationEvent.SignedOut:
        this.reloadUser();
        break;
      case ApplicationEvent.WillSync:
        if (!this.completedInitialSync) {
          this.application.getStatusManager().setMessage('Syncing…');
        }
        break;
    }
  }

  streamItems() {
    this.application.setDisplayOptions(
      ContentType.Theme,
      CollectionSort.Title,
      'asc',
      (theme: SNTheme) => {
        return (
          theme.package_info &&
          theme.package_info.dock_icon
        );
      }
    )

    this.observerRemovers.push(this.application.streamItems(
      ContentType.Component,
      async () => {
        const components = this.application.getItems(ContentType.Component) as SNComponent[];
        this.rooms = components.filter((candidate) => {
          return candidate.area === ComponentArea.Rooms && !candidate.deleted;
        });
        if (this.queueExtReload) {
          this.queueExtReload = false;
          this.reloadExtendedData();
        }
      }
    ));

    this.observerRemovers.push(this.application.streamItems(
      ContentType.Theme,
      async () => {
        const themes = this.application.getDisplayableItems(ContentType.Theme) as SNTheme[];
        this.themesWithIcons = themes;
        this.reloadDockShortcuts();
      }
    ));
  }

  registerComponentHandler() {
    this.unregisterComponent = this.application.componentManager!.registerHandler({
      identifier: 'room-bar',
      areas: [ComponentArea.Rooms, ComponentArea.Modal],
      focusHandler: (component, focused) => {
        if (component.isEditor() && focused) {
          if (component.package_info?.identifier === 'org.standardnotes.standard-sheets') {
            return;
          }
          this.closeAllRooms();
          this.closeAccountMenu();
        }
      }
    });
  }

  updateSyncStatus() {
    const statusManager = this.application.getStatusManager();
    const syncStatus = this.application!.getSyncStatus();
    const stats = syncStatus.getStats();
    if (syncStatus.hasError()) {
      statusManager.setMessage('Unable to Sync');
    } else if (stats.downloadCount > 20) {
      const text = `Downloading ${stats.downloadCount} items. Keep app open.`;
      statusManager.setMessage(text);
      this.showingDownloadStatus = true;
    } else if (this.showingDownloadStatus) {
      this.showingDownloadStatus = false;
      statusManager.setMessage('Download Complete.');
      setTimeout(() => {
        statusManager.setMessage('');
      }, 2000);
    } else if (stats.uploadTotalCount > 20) {
      const completionPercentage = stats.uploadCompletionCount === 0
        ? 0
        : stats.uploadCompletionCount / stats.uploadTotalCount;

      const stringPercentage = completionPercentage.toLocaleString(
        undefined,
        { style: 'percent' }
      );

      statusManager.setMessage(
        `Syncing ${stats.uploadTotalCount} items (${stringPercentage} complete)`,
      );
    } else {
      statusManager.setMessage('');
    }
  }

  updateLocalDataStatus() {
    const statusManager = this.application.getStatusManager();
    const syncStatus = this.application!.getSyncStatus();
    const stats = syncStatus.getStats();
    const encryption = this.application!.isEncryptionAvailable();
    if (stats.localDataDone) {
      statusManager.setMessage('');
      return;
    }
    const notesString = `${stats.localDataCurrent}/${stats.localDataTotal} items...`;
    const loadingStatus = encryption
      ? `Decrypting ${notesString}`
      : `Loading ${notesString}`;
    statusManager.setMessage(loadingStatus);
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
      return room.package_info.identifier === this.application
        .getNativeExtService().extManagerId;
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

  async openSecurityUpdate() {
    if (await confirmDialog({
      title: STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
      text: STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
      confirmButtonText: STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
    })) {
      preventRefreshing(STRING_CONFIRM_APP_QUIT_DURING_UPGRADE, async () => {
        await this.application.upgradeProtocolVersion();
      });
    }
  }

  findErrors() {
    this.hasError = this.application.getSyncStatus().hasError();
  }

  accountMenuPressed() {
    this.showAccountMenu = !this.showAccountMenu;
    this.closeAllRooms();
  }

  toggleSyncResolutionMenu() {
    this.showSyncResolution = !this.showSyncResolution;
  }

  closeAccountMenu() {
    this.showAccountMenu = false;
  }

  lockApp() {
    this.application.lock();
  }

  refreshData() {
    this.isRefreshing = true;
    this.application.sync({
      queueStrategy: SyncQueueStrategy.ForceSpawnNew,
      checkIntegrity: true
    }).then((response) => {
      this.$timeout(() => {
        this.isRefreshing = false;
      }, 200);
      if (response && response.error) {
        this.application.alertService!.alert(
          STRING_GENERIC_SYNC_ERROR
        );
      } else {
        this.syncUpdated();
      }
    });
  }

  syncUpdated() {
    this.lastSyncDate = dateToLocalizedString(this.application.getLastSyncDate()!);
  }

  onNewUpdateAvailable() {
    this.newUpdateAvailable = true;
  }

  clickedNewUpdateAnnouncement() {
    this.newUpdateAvailable = false;
    this.application.alertService!.alert(
      STRING_NEW_UPDATE_READY
    );
  }

  reloadDockShortcuts() {
    const shortcuts = [];
    for (const theme of this.themesWithIcons) {
      if (!theme.package_info) {
        continue;
      }
      const name = theme.package_info.name;
      const icon = theme.package_info.dock_icon;
      if (!icon) {
        continue;
      }
      shortcuts.push({
        name: name,
        component: theme,
        icon: icon
      } as DockShortcut);
    }
    this.setState({
      dockShortcuts: shortcuts.sort((a, b) => {
        /** Circles first, then images */
        const aType = a.icon.type;
        const bType = b.icon.type;
        if (aType === 'circle' && bType === 'svg') {
          return -1;
        } else if (bType === 'circle' && aType === 'svg') {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      })
    });
  }

  initSvgForShortcut(shortcut: DockShortcut) {
    const id = 'dock-svg-' + shortcut.component.uuid;
    const element = document.getElementById(id)!;
    const parser = new DOMParser();
    const svg = shortcut.component.package_info.dock_icon.source;
    const doc = parser.parseFromString(svg, 'image/svg+xml');
    element.appendChild(doc.documentElement);
  }

  selectShortcut(shortcut: DockShortcut) {
    this.application.toggleComponent(shortcut.component);
  }

  onRoomDismiss(room: SNComponent) {
    this.roomShowState[room.uuid] = false;
  }

  closeAllRooms() {
    for (const room of this.rooms) {
      this.roomShowState[room.uuid] = false;
    }
  }

  async selectRoom(room: SNComponent) {
    this.$timeout(() => {
      this.roomShowState[room.uuid] = !this.roomShowState[room.uuid];
    });
  }

  displayBetaDialog() {
    alertDialog({
      title: 'You are using a beta version of the app',
      text:
        'If you wish to go back to a stable version, make sure to sign out ' +
        'of this beta app first.<br>You can silence this warning from the ' +
        '<em>Account</em> menu.'
    });
  }

  clickOutsideAccountMenu() {
    if (this.application && this.application.authenticationInProgress()) {
      return;
    }
    this.showAccountMenu = false;
  }
}

export class FooterView extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = FooterViewCtrl;
    this.replace = true;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
