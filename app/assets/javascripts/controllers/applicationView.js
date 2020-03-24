import { getPlatformString } from '@/utils';
import template from '%/application-view.pug';
import { AppStateEvents } from '@/services/state';
import { ApplicationEvents } from 'snjs';
import angular from 'angular';
import {
  PANEL_NAME_NOTES,
  PANEL_NAME_TAGS
} from '@/controllers/constants';
import {
  STRING_SESSION_EXPIRED,
  STRING_DEFAULT_FILE_ERROR
} from '@/strings';
import { PureCtrl } from './abstract/pure_ctrl';

class ApplicationViewCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $compile,
    $location,
    $rootScope,
    $timeout
  ) {
    super($timeout);
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.platformString = getPlatformString();
    this.state = { appClass: '' };
    this.onDragDrop = this.onDragDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.openModalComponent = this.openModalComponent.bind(this);
    this.presentPermissionsDialog = this.presentPermissionsDialog.bind(this);
    this.addDragDropHandlers();
  }

  deinit() {
    this.$location = null;
    this.$rootScope = null;
    this.$compile = null;
    this.application = null;
    this.lockScreenPuppet = null;
    window.removeEventListener('dragover', this.onDragOver, true);
    window.removeEventListener('drop', this.onDragDrop, true);
    this.onDragDrop = null;
    this.onDragOver = null;
    this.openModalComponent = null;
    this.presentPermissionsDialog = null;
    super.deinit();
  }

  $onInit() {
    super.$onInit();
    this.loadApplication();
  }

  async loadApplication() {
    await this.application.prepareForLaunch({
      callbacks: {
        receiveChallenge: async (challenge, orchestrator) => {
          this.application.promptForChallenge(challenge, orchestrator);
        }
      }
    });
    await this.application.launch();

  }

  onAppStart() {
    super.onAppStart();
    this.overrideComponentManagerFunctions();
    this.application.componentManager.setDesktopManager(this.application.getDesktopService());
    this.setState({
      ready: true,
      needsUnlock: this.application.hasPasscode()
    });
  }

  onAppLaunch() {
    super.onAppLaunch();
    this.setState({ needsUnlock: false });
    this.handleAutoSignInFromParams();
  }

  onUpdateAvailable() {
    this.$rootScope.$broadcast('new-update-available');
  };

  /** @override */
  async onAppEvent(eventName) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvents.LocalDataIncrementalLoad) {
      this.updateLocalDataStatus();
    } else if (eventName === ApplicationEvents.SyncStatusChanged) {
      this.updateSyncStatus();
    } else if (eventName === ApplicationEvents.LocalDataLoaded) {
      this.updateLocalDataStatus();
    } else if (eventName === ApplicationEvents.WillSync) {
      if (!this.completedInitialSync) {
        this.syncStatus = this.application.getStatusService().replaceStatusWithString(
          this.syncStatus,
          "Syncing..."
        );
      }
    } else if (eventName === ApplicationEvents.CompletedSync) {
      if (!this.completedInitialSync) {
        this.syncStatus = this.application.getStatusService().removeStatus(this.syncStatus);
        this.completedInitialSync = true;
      }
    } else if (eventName === ApplicationEvents.InvalidSyncSession) {
      this.showInvalidSessionAlert();
    }
  }

  /** @override */
  async onAppStateEvent(eventName, data) {
    if (eventName === AppStateEvents.PanelResized) {
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
    } else if (eventName === AppStateEvents.WindowDidFocus) {
      if (!(await this.application.isLocked())) {
        this.application.sync();
      }
    }
  }

  updateLocalDataStatus() {
    const syncStatus = this.application.getSyncStatus();
    const stats = syncStatus.getStats();
    const encryption = this.application.isEncryptionAvailable();
    if (stats.localDataDone) {
      this.syncStatus = this.application.getStatusService().removeStatus(this.syncStatus);
      return;
    }
    const notesString = `${stats.localDataCurrent}/${stats.localDataTotal} items...`;
    const loadingStatus = encryption
      ? `Decrypting ${notesString}`
      : `Loading ${notesString}`;
    this.syncStatus = this.application.getStatusService().replaceStatusWithString(
      this.syncStatus,
      loadingStatus
    );
  }

  updateSyncStatus() {
    const syncStatus = this.application.getSyncStatus();
    const stats = syncStatus.getStats();
    if (stats.downloadCount > 20) {
      const text = `Downloading ${stats.downloadCount} items. Keep app open.`;
      this.syncStatus = this.application.getStatusService().replaceStatusWithString(
        this.syncStatus,
        text
      );
      this.showingDownloadStatus = true;
    } else if (this.showingDownloadStatus) {
      this.showingDownloadStatus = false;
      const text = "Download Complete.";
      this.syncStatus = this.application.getStatusService().replaceStatusWithString(
        this.syncStatus,
        text
      );
      setTimeout(() => {
        this.syncStatus = this.application.getStatusService().removeStatus(this.syncStatus);
      }, 2000);
    } else if (stats.uploadTotalCount > 20) {
      this.uploadSyncStatus = this.application.getStatusService().replaceStatusWithString(
        this.uploadSyncStatus,
        `Syncing ${stats.uploadCompletionCount}/${stats.uploadTotalCount} items...`
      );
    } else if (this.uploadSyncStatus) {
      this.uploadSyncStatus = this.application.getStatusService().removeStatus(
        this.uploadSyncStatus
      );
    }
  }

  openModalComponent(component) {
    const scope = this.$rootScope.$new(true);
    scope.component = component;
    const el = this.$compile("<component-modal component='component' class='sk-modal'></component-modal>")(scope);
    angular.element(document.body).append(el);
  }

  presentPermissionsDialog(dialog) {
    const scope = this.$rootScope.$new(true);
    scope.permissionsString = dialog.permissionsString;
    scope.component = dialog.component;
    scope.callback = dialog.callback;
    const el = this.$compile("<permissions-modal component='component' permissions-string='permissionsString' callback='callback' class='sk-modal'></permissions-modal>")(scope);
    angular.element(document.body).append(el);
  }

  overrideComponentManagerFunctions() {
    this.application.componentManager.openModalComponent = this.openModalComponent;
    this.application.componentManager.presentPermissionsDialog = this.presentPermissionsDialog;
  }

  showInvalidSessionAlert() {
    /** Don't show repeatedly; at most 30 seconds in between */
    const SHOW_INTERVAL = 30;
    const lastShownSeconds = (new Date() - this.lastShownDate) / 1000;
    if (!this.lastShownDate || lastShownSeconds > SHOW_INTERVAL) {
      this.lastShownDate = new Date();
      setTimeout(() => {
        this.alertService.alert({
          text: STRING_SESSION_EXPIRED
        });
      }, 500);
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

  onDragOver(event) {
    if (event.dataTransfer.files.length > 0) {
      event.preventDefault();
    }
  }

  onDragDrop(event) {
    if (event.dataTransfer.files.length > 0) {
      event.preventDefault();
      this.application.alertService.alert({
        text: STRING_DEFAULT_FILE_ERROR
      });
    }
  }

  async handleAutoSignInFromParams() {
    const params = this.$location.search();
    const server = params.server;
    const email = params.email;
    const password = params.pw;
    if (!server || !email || !password) return;

    const user = this.application.getUser();
    if (user) {
      if (user.email === email && await this.application.getHost() === server) {
        /** Already signed in, return */
        return;
      } else {
        /** Sign out */
        await this.application.signOut();
        await this.application.restart();
      }
    }
    await this.application.setHost(server);
    this.application.signIn({
      email: email,
      password: password,
    });
  }
}

export class ApplicationView {
  constructor() {
    this.template = template;
    this.controller = ApplicationViewCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = {
      application: '='
    };
  }
}
