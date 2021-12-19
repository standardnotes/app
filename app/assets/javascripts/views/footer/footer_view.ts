import { RootScopeMessages } from './../../messages';
import { ApplicationGroup } from '@/ui_models/application_group';
import { WebDirective } from '@/types';
import { preventRefreshing } from '@/utils';
import {
  ApplicationEvent,
  ContentType,
  SNTheme,
  CollectionSort,
} from '@standardnotes/snjs';
import template from './footer-view.pug';
import { AppStateEvent, EventSource } from '@/ui_models/app_state';
import {
  STRING_NEW_UPDATE_READY,
  STRING_CONFIRM_APP_QUIT_DURING_UPGRADE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
} from '@/strings';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { alertDialog, confirmDialog } from '@/services/alertService';
import { AccountMenuPane } from '@/components/AccountMenu';

/**
 * Disable before production release.
 * Anyone who used the beta will still have access to
 * the account switcher in production via local storage flag
 */
const ACCOUNT_SWITCHER_ENABLED = false;
const ACCOUNT_SWITCHER_FEATURE_KEY = 'account_switcher';

class FooterViewCtrl extends PureViewCtrl<
  unknown,
  {
    outOfSync: boolean;
    hasPasscode: boolean;
    dataUpgradeAvailable: boolean;
    hasAccountSwitcher: boolean;
    showBetaWarning: boolean;
    showDataUpgrade: boolean;
  }
> {
  private $rootScope: ng.IRootScopeService;
  private showSyncResolution = false;
  private rootScopeListener2: any;
  public arbitraryStatusMessage?: string;
  public user?: any;
  private offline = true;
  public showAccountMenu = false;
  public showQuickSettingsMenu = false;
  private didCheckForOffline = false;
  public hasError = false;
  public newUpdateAvailable = false;
  private observerRemovers: Array<() => void> = [];
  private completedInitialSync = false;
  private showingDownloadStatus = false;

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
    this.rootScopeListener2();
    this.rootScopeListener2 = undefined;
    (this.closeAccountMenu as unknown) = undefined;
    (this.toggleSyncResolutionMenu as unknown) = undefined;
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
    this.autorun(() => {
      const showBetaWarning = this.appState.showBetaWarning;
      this.showAccountMenu = this.appState.accountMenu.show;
      this.showQuickSettingsMenu = this.appState.quickSettingsMenu.open;
      this.setState({
        showBetaWarning: showBetaWarning,
        showDataUpgrade: !showBetaWarning,
      });
    });
  }

  loadAccountSwitcherState() {
    const stringValue = localStorage.getItem(ACCOUNT_SWITCHER_FEATURE_KEY);
    if (!stringValue && ACCOUNT_SWITCHER_ENABLED) {
      /** Enable permanently for this user so they don't lose the feature after its disabled */
      localStorage.setItem(ACCOUNT_SWITCHER_FEATURE_KEY, JSON.stringify(true));
    }
    const hasAccountSwitcher = stringValue
      ? JSON.parse(stringValue)
      : ACCOUNT_SWITCHER_ENABLED;
    this.setState({ hasAccountSwitcher });
  }

  getInitialState() {
    return {
      outOfSync: false,
      dataUpgradeAvailable: false,
      hasPasscode: false,
      descriptors: this.mainApplicationGroup.getDescriptors(),
      hasAccountSwitcher: false,
      showBetaWarning: false,
      showDataUpgrade: false,
    };
  }

  reloadUpgradeStatus() {
    this.application.checkForSecurityUpdate().then((available) => {
      this.setState({
        dataUpgradeAvailable: available,
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
  }

  reloadUser() {
    this.user = this.application.getUser();
  }

  async reloadPasscodeStatus() {
    const hasPasscode = this.application.hasPasscode();
    this.setState({
      hasPasscode: hasPasscode,
    });
  }

  addRootScopeListeners() {
    this.rootScopeListener2 = this.$rootScope.$on(
      RootScopeMessages.NewUpdateAvailable,
      () => {
        this.$timeout(() => {
          this.onNewUpdateAvailable();
        });
      }
    );
  }

  /** @override */
  onAppStateEvent(eventName: AppStateEvent, data: any) {
    const statusService = this.application.getStatusManager();
    switch (eventName) {
      case AppStateEvent.EditorFocused:
        if (data.eventSource === EventSource.UserInteraction) {
          this.closeAccountMenu();
        }
        break;
      case AppStateEvent.BeganBackupDownload:
        statusService.setMessage('Saving local backup…');
        break;
      case AppStateEvent.EndedBackupDownload: {
        const successMessage = 'Successfully saved backup.';
        const errorMessage = 'Unable to save local backup.';
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
          outOfSync: true,
        });
        break;
      case ApplicationEvent.ExitedOutOfSync:
        this.setState({
          outOfSync: false,
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
            this.appState.accountMenu.setShow(true);
          }
        }
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
        return !theme.errorDecrypting;
      }
    );
  }

  updateSyncStatus() {
    const statusManager = this.application.getStatusManager();
    const syncStatus = this.application.getSyncStatus();
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
      const completionPercentage =
        stats.uploadCompletionCount === 0
          ? 0
          : stats.uploadCompletionCount / stats.uploadTotalCount;

      const stringPercentage = completionPercentage.toLocaleString(undefined, {
        style: 'percent',
      });

      statusManager.setMessage(
        `Syncing ${stats.uploadTotalCount} items (${stringPercentage} complete)`
      );
    } else {
      statusManager.setMessage('');
    }
  }

  updateLocalDataStatus() {
    const statusManager = this.application.getStatusManager();
    const syncStatus = this.application.getSyncStatus();
    const stats = syncStatus.getStats();
    const encryption = this.application.isEncryptionAvailable();
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

  updateOfflineStatus() {
    this.offline = this.application.noAccount();
  }

  async openSecurityUpdate() {
    if (
      await confirmDialog({
        title: STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
        text: STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
        confirmButtonText: STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
      })
    ) {
      preventRefreshing(STRING_CONFIRM_APP_QUIT_DURING_UPGRADE, async () => {
        await this.application.upgradeProtocolVersion();
      });
    }
  }

  findErrors() {
    this.hasError = this.application.getSyncStatus().hasError();
  }

  accountMenuPressed() {
    this.appState.quickSettingsMenu.closeQuickSettingsMenu();
    this.appState.accountMenu.toggleShow();
  }

  quickSettingsPressed() {
    this.appState.accountMenu.closeAccountMenu();
    this.appState.quickSettingsMenu.toggle();
  }

  toggleSyncResolutionMenu() {
    this.showSyncResolution = !this.showSyncResolution;
  }

  closeAccountMenu() {
    this.appState.accountMenu.setShow(false);
    this.appState.accountMenu.setCurrentPane(AccountMenuPane.GeneralMenu);
  }

  lockApp() {
    this.application.lock();
  }

  onNewUpdateAvailable() {
    this.newUpdateAvailable = true;
  }

  clickedNewUpdateAnnouncement() {
    this.newUpdateAvailable = false;
    this.application.alertService.alert(STRING_NEW_UPDATE_READY);
  }

  displayBetaDialog() {
    alertDialog({
      title: 'You are using a beta version of the app',
      text:
        'If you wish to go back to a stable version, make sure to sign out ' +
        'of this beta app first.<br>You can silence this warning from the ' +
        '<em>Account</em> menu.',
    });
  }

  clickOutsideAccountMenu() {
    if (this.application && this.application.authenticationInProgress()) {
      return;
    }
    this.appState.accountMenu.closeAccountMenu();
  }

  clickOutsideQuickSettingsMenu() {
    this.appState.quickSettingsMenu.closeQuickSettingsMenu();
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
      application: '=',
    };
  }
}
