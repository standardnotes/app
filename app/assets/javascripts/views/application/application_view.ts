import { WebDirective } from '@/types';
import { getPlatformString } from '@/utils';
import template from './application-view.pug';
import { AppStateEvent } from '@/ui_models/app_state';
import { ApplicationEvent } from 'snjs';
import {
  PANEL_NAME_NOTES,
  PANEL_NAME_TAGS
} from '@/views/constants';
import {
  STRING_DEFAULT_FILE_ERROR
} from '@/strings';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';

class ApplicationViewCtrl extends PureViewCtrl {
  private $location?: ng.ILocationService
  private $rootScope?: ng.IRootScopeService
  public platformString: string
  private completedInitialSync = false
  private syncStatus: any
  private notesCollapsed = false
  private tagsCollapsed = false
  private showingDownloadStatus = false
  private uploadSyncStatus: any

  /* @ngInject */
  constructor(
    $location: ng.ILocationService,
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.platformString = getPlatformString();
    this.state = { appClass: '' };
    this.onDragDrop = this.onDragDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.addDragDropHandlers();
  }

  deinit() {
    this.$location = undefined;
    this.$rootScope = undefined;
    (this.application as any) = undefined;
    window.removeEventListener('dragover', this.onDragOver, true);
    window.removeEventListener('drop', this.onDragDrop, true);
    (this.onDragDrop as any) = undefined;
    (this.onDragOver as any) = undefined;
    super.deinit();
  }

  $onInit() {
    super.$onInit();
    this.loadApplication();
  }

  async loadApplication() {
    await this.application!.prepareForLaunch({
      receiveChallenge: async (challenge) => {
        this.application!.promptForChallenge(challenge);
      }
    });
    await this.application!.launch();
  }

  async onAppStart() {
    super.onAppStart();
    this.application!.componentManager!.setDesktopManager(
      this.application!.getDesktopService()
    );
    this.setState({
      ready: true,
      needsUnlock: this.application!.hasPasscode()
    });
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.setState({ needsUnlock: false });
    this.handleAutoSignInFromParams();
  }

  onUpdateAvailable() {
    this.$rootScope!.$broadcast('new-update-available');
  };

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvent.LocalDataIncrementalLoad) {
      this.updateLocalDataStatus();
    } else if (
      eventName === ApplicationEvent.SyncStatusChanged ||
      eventName === ApplicationEvent.FailedSync
    ) {
      this.updateSyncStatus();
    } else if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.updateLocalDataStatus();
    } else if (eventName === ApplicationEvent.WillSync) {
      if (!this.completedInitialSync) {
        this.syncStatus = this.application!.getStatusService().replaceStatusWithString(
          this.syncStatus,
          "Syncing…"
        );
      }
    } else if (eventName === ApplicationEvent.CompletedFullSync) {
      if (!this.completedInitialSync) {
        this.syncStatus = this.application!.getStatusService().removeStatus(this.syncStatus);
        this.completedInitialSync = true;
      }
    } else if (eventName === ApplicationEvent.LocalDatabaseReadError) {
      this.application!.alertService!.alert(
        'Unable to load local database. Please restart the app and try again.'
      );
    } else if (eventName === ApplicationEvent.LocalDatabaseWriteError) {
      this.application!.alertService!.alert(
        'Unable to write to local database. Please restart the app and try again.'
      );
    }
  }

  /** @override */
  async onAppStateEvent(eventName: AppStateEvent, data?: any) {
    if (eventName === AppStateEvent.PanelResized) {
      if (data.panel === PANEL_NAME_NOTES) {
        this.notesCollapsed = data.collapsed;
      }
      if (data.panel === PANEL_NAME_TAGS) {
        this.tagsCollapsed = data.collapsed;
      }
      let appClass = "";
      if (this.notesCollapsed) { appClass += "collapsed-notes"; }
      if (this.tagsCollapsed) { appClass += " collapsed-tags"; }
      this.setState({ appClass });
    } else if (eventName === AppStateEvent.WindowDidFocus) {
      if (!(await this.application!.isLocked())) {
        this.application!.sync();
      }
    }
  }

  updateLocalDataStatus() {
    const syncStatus = this.application!.getSyncStatus();
    const stats = syncStatus.getStats();
    const encryption = this.application!.isEncryptionAvailable();
    if (stats.localDataDone) {
      this.syncStatus = this.application!.getStatusService().removeStatus(this.syncStatus);
      return;
    }
    const notesString = `${stats.localDataCurrent}/${stats.localDataTotal} items...`;
    const loadingStatus = encryption
      ? `Decrypting ${notesString}`
      : `Loading ${notesString}`;
    this.syncStatus = this.application!.getStatusService().replaceStatusWithString(
      this.syncStatus,
      loadingStatus
    );
  }

  updateSyncStatus() {
    const syncStatus = this.application!.getSyncStatus();
    const stats = syncStatus.getStats();
    if (syncStatus.hasError()) {
      this.syncStatus = this.application!.getStatusService().replaceStatusWithString(
        this.syncStatus,
        'Unable to Sync'
      );
    } else if (stats.downloadCount > 20) {
      const text = `Downloading ${stats.downloadCount} items. Keep app open.`;
      this.syncStatus = this.application!.getStatusService().replaceStatusWithString(
        this.syncStatus,
        text
      );
      this.showingDownloadStatus = true;
    } else if (this.showingDownloadStatus) {
      this.showingDownloadStatus = false;
      const text = "Download Complete.";
      this.syncStatus = this.application!.getStatusService().replaceStatusWithString(
        this.syncStatus,
        text
      );
      setTimeout(() => {
        this.syncStatus = this.application!.getStatusService().removeStatus(this.syncStatus);
      }, 2000);
    } else if (stats.uploadTotalCount > 20) {
      const completionPercentage = stats.uploadCompletionCount === 0
        ? 0
        : stats.uploadCompletionCount / stats.uploadTotalCount;

      const stringPercentage = completionPercentage.toLocaleString(
        undefined,
        { style: 'percent' }
      );

      this.uploadSyncStatus = this.application!.getStatusService().replaceStatusWithString(
        this.uploadSyncStatus,
        `Syncing ${stats.uploadTotalCount} items (${stringPercentage} complete)`,
      );
    } else {
      if (this.syncStatus) {
        this.syncStatus = this.application!.getStatusService().removeStatus(
          this.syncStatus
        );
      }
      if (this.uploadSyncStatus) {
        this.uploadSyncStatus = this.application!.getStatusService().removeStatus(
          this.uploadSyncStatus
        );
      }
    }
  }

  addDragDropHandlers() {
    /**
     * Disable dragging and dropping of files (but allow text) into main SN interface.
     * both 'dragover' and 'drop' are required to prevent dropping of files.
     * This will not prevent extensions from receiving drop events.
     */
    window.addEventListener('dragover', this.onDragOver, true);
    window.addEventListener('drop', this.onDragDrop, true);
  }

  onDragOver(event: DragEvent) {
    if (event.dataTransfer!.files.length > 0) {
      event.preventDefault();
    }
  }

  onDragDrop(event: DragEvent) {
    if (event.dataTransfer!.files.length > 0) {
      event.preventDefault();
      this.application!.alertService!.alert(
        STRING_DEFAULT_FILE_ERROR
      );
    }
  }

  async handleAutoSignInFromParams() {
    const params = this.$location!.search();
    const server = params.server;
    const email = params.email;
    const password = params.pw;
    if (!server || !email || !password) return;

    const user = this.application!.getUser();
    if (user) {
      if (user.email === email && await this.application!.getHost() === server) {
        /** Already signed in, return */
        return;
      } else {
        /** Sign out */
        await this.application!.signOut();
      }
    }
    await this.application!.setHost(server);
    this.application!.signIn(
      email,
      password,
    );
  }
}

export class ApplicationView extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.controller = ApplicationViewCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
