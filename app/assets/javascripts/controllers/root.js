import _ from 'lodash';
import { Challenges } from 'snjs';
import { getPlatformString } from '@/utils';
import template from '%/root.pug';
import {
  APP_STATE_EVENT_PANEL_RESIZED,
  APP_STATE_EVENT_WINDOW_DID_FOCUS
} from '@/state';
import {
  PANEL_NAME_NOTES,
  PANEL_NAME_TAGS
} from '@/controllers/constants';
import {
  STRING_SESSION_EXPIRED,
  STRING_DEFAULT_FILE_ERROR,
  StringSyncException
} from '@/strings';

class RootCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $location,
    $rootScope,
    $timeout,
    application,
    appState,
    databaseManager,
    lockManager,
    preferencesManager,
    themeManager /** Unused below, required to load globally */,
    statusManager,
  ) {
    super($timeout);
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.application = application;
    this.appState = appState;
    this.databaseManager = databaseManager;
    this.lockManager = lockManager;
    this.preferencesManager = preferencesManager;
    this.statusManager = statusManager;
    this.platformString = getPlatformString();
    this.state = {
      needsUnlock: false,
      appClass: ''
    };

    this.loadApplication();
    this.handleAutoSignInFromParams();
    this.addAppStateObserver();
    this.addDragDropHandlers();
  }

  async loadApplication() {
    this.application.prepareForLaunch({
      callbacks: {
        authChallengeResponses: async (challenges) => {
          if (challenges.includes(Challenges.LocalPasscode)) {
            this.setState({ needsUnlock: true });
          }
        }
      }
    });
    await this.application.launch();
    this.setState({ needsUnlock: false });
    await this.openDatabase();
    this.preferencesManager.load();
    this.addSyncStatusObserver();
    this.addSyncEventHandler();
  }

  onUpdateAvailable() {
    this.$rootScope.$broadcast('new-update-available');
  };

  addAppStateObserver() {
    this.appState.addObserver(async (eventName, data) => {
      if (eventName === APP_STATE_EVENT_PANEL_RESIZED) {
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
      } else if (eventName === APP_STATE_EVENT_WINDOW_DID_FOCUS) {
        if (!(await this.application.isPasscodeLocked())) {
          this.application.sync();
        }
      }
    });
  }

  async openDatabase() {
    this.databaseManager.setLocked(false);
    this.databaseManager.openDatabase({
      onUpgradeNeeded: () => {
        /**
         * New database/database wiped, delete syncToken so that items
         * can be refetched entirely from server
         */
        this.application.syncManager.clearSyncPositionTokens();
        this.application.sync();
      }
    });
  }

  // addSyncStatusObserver() {
  //   this.syncStatusObserver = this.syncManager.registerSyncStatusObserver((status) => {
  //     if (status.retrievedCount > 20) {
  //       const text = `Downloading ${status.retrievedCount} items. Keep app open.`;
  //       this.syncStatus = this.statusManager.replaceStatusWithString(
  //         this.syncStatus,
  //         text
  //       );
  //       this.showingDownloadStatus = true;
  //     } else if (this.showingDownloadStatus) {
  //       this.showingDownloadStatus = false;
  //       const text = "Download Complete.";
  //       this.syncStatus = this.statusManager.replaceStatusWithString(
  //         this.syncStatus,
  //         text
  //       );
  //       setTimeout(() => {
  //         this.syncStatus = this.statusManager.removeStatus(this.syncStatus);
  //       }, 2000);
  //     } else if (status.total > 20) {
  //       this.uploadSyncStatus = this.statusManager.replaceStatusWithString(
  //         this.uploadSyncStatus,
  //         `Syncing ${status.current}/${status.total} items...`
  //       );
  //     } else if (this.uploadSyncStatus) {
  //       this.uploadSyncStatus = this.statusManager.removeStatus(
  //         this.uploadSyncStatus
  //       );
  //     }
  //   });
  // }

  // addSyncEventHandler() {
  //   let lastShownDate;
  //   this.syncManager.addEventHandler((syncEvent, data) => {
  //     this.$rootScope.$broadcast(
  //       syncEvent,
  //       data || {}
  //     );
  //     if (syncEvent === 'sync-session-invalid') {
  //       /** Don't show repeatedly; at most 30 seconds in between */
  //       const SHOW_INTERVAL = 30;
  //       const lastShownSeconds = (new Date() - lastShownDate) / 1000;
  //       if (!lastShownDate || lastShownSeconds > SHOW_INTERVAL) {
  //         lastShownDate = new Date();
  //         setTimeout(() => {
  //           this.alertManager.alert({
  //             text: STRING_SESSION_EXPIRED
  //           });
  //         }, 500);
  //       }
  //     } else if (syncEvent === 'sync-exception') {
  //       this.alertManager.alert({
  //         text: StringSyncException(data)
  //       });
  //     }
  //   });
  // }

  // loadLocalData() {
  //   const encryptionEnabled = this.application.getUser || this.application.hasPasscode();
  //   this.syncStatus = this.statusManager.addStatusFromString(
  //     encryptionEnabled ? "Decrypting items..." : "Loading items..."
  //   );
  //   const incrementalCallback = (current, total) => {
  //     const notesString = `${current}/${total} items...`;
  //     const status = encryptionEnabled
  //       ? `Decrypting ${notesString}`
  //       : `Loading ${notesString}`;
  //     this.syncStatus = this.statusManager.replaceStatusWithString(
  //       this.syncStatus,
  //       status
  //     );
  //   };
  //   this.syncManager.loadLocalItems({ incrementalCallback }).then(() => {
  //     this.$timeout(() => {
  //       this.$rootScope.$broadcast("initial-data-loaded");
  //       this.syncStatus = this.statusManager.replaceStatusWithString(
  //         this.syncStatus,
  //         "Syncing..."
  //       );
  //       this.syncManager.sync({
  //         checkIntegrity: true
  //       }).then(() => {
  //         this.syncStatus = this.statusManager.removeStatus(this.syncStatus);
  //       });
  //     });
  //   });
  // }

  addDragDropHandlers() {
    /**
     * Disable dragging and dropping of files (but allow text) into main SN interface.
     * both 'dragover' and 'drop' are required to prevent dropping of files.
     * This will not prevent extensions from receiving drop events.
     */
    window.addEventListener('dragover', (event) => {
      if (event.dataTransfer.files.length > 0) {
        event.preventDefault();
      }
    }, false);

    window.addEventListener('drop', (event) => {
      if (event.dataTransfer.files.length > 0) {
        event.preventDefault();
        this.application.alertManager.alert({
          text: STRING_DEFAULT_FILE_ERROR
        });
      }
    }, false);
  }

  handleAutoSignInFromParams() {
    const urlParam = (key) => {
      return this.$location.search()[key];
    };

    const autoSignInFromParams = async () => {
      const server = urlParam('server');
      const email = urlParam('email');
      const pw = urlParam('pw');
      if (!this.application.getUser()) {
        if (
          await this.application.getHost() === server
          && this.application.getUser().email === email
        ) {
          /** Already signed in, return */
          // eslint-disable-next-line no-useless-return
          return;
        } else {
          /** Sign out */
          await this.application.signOut();
          await this.application.restart();
        }
      } else {
        await this.application.setHost(server);
        this.application.signIn({
          email: email,
          password: pw,
        });
      }
    };

    if (urlParam('server')) {
      autoSignInFromParams();
    }
  }
}

export class Root {
  constructor() {
    this.template = template;
    this.controller = RootCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
