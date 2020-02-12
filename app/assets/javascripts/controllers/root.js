import { SFAuthManager } from 'snjs';
import { getPlatformString } from '@/utils';
import template from '%/root.pug';
import {
  APP_STATE_EVENT_PANEL_RESIZED
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

/** How often to automatically sync, in milliseconds */
const AUTO_SYNC_INTERVAL = 30000;

class RootCtrl {
  /* @ngInject */
  constructor(
    $location,
    $rootScope,
    $scope,
    $timeout,
    alertManager,
    appState,
    authManager,
    dbManager,
    modelManager,
    passcodeManager,
    preferencesManager,
    themeManager /** Unused below, required to load globally */,
    statusManager,
    storageManager,
    syncManager,
  ) {
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$location = $location;
    this.$timeout = $timeout;
    this.dbManager = dbManager;
    this.syncManager = syncManager;
    this.statusManager = statusManager;
    this.storageManager = storageManager;
    this.appState = appState;
    this.authManager = authManager;
    this.modelManager = modelManager;
    this.alertManager = alertManager;
    this.preferencesManager = preferencesManager;
    this.passcodeManager = passcodeManager;

    this.defineRootScopeFunctions();
    this.initializeStorageManager();
    this.addAppStateObserver();
    this.defaultLoad();
    this.handleAutoSignInFromParams();
    this.addDragDropHandlers();
  }

  defineRootScopeFunctions() {
    this.$rootScope.lockApplication = () => {
      /** Reloading wipes current objects from memory */
      window.location.reload();
    };

    this.$rootScope.safeApply = (fn) => {
      const phase = this.$scope.$root.$$phase;
      if(phase === '$apply' || phase === '$digest') {
        this.$scope.$eval(fn);
      } else {
        this.$scope.$apply(fn);
      }
    };
  }

  defaultLoad() {
    this.$scope.platform = getPlatformString();

    if(this.passcodeManager.isLocked()) {
      this.$scope.needsUnlock = true;
    } else {
      this.loadAfterUnlock();
    }

    this.$scope.onSuccessfulUnlock = () => {
      this.$timeout(() => {
        this.$scope.needsUnlock = false;
        this.loadAfterUnlock();
      });
    };

    this.$scope.onUpdateAvailable = () => {
      this.$rootScope.$broadcast('new-update-available');
    };
  }

  initializeStorageManager() {
    this.storageManager.initialize(
      this.passcodeManager.hasPasscode(),
      this.authManager.isEphemeralSession()
    );
  }

  addAppStateObserver() {
    this.appState.addObserver((eventName, data) => {
      if(eventName === APP_STATE_EVENT_PANEL_RESIZED) {
        if(data.panel === PANEL_NAME_NOTES) {
          this.notesCollapsed = data.collapsed;
        }
        if(data.panel === PANEL_NAME_TAGS) {
          this.tagsCollapsed = data.collapsed;
        }
        let appClass = "";
        if(this.notesCollapsed) { appClass += "collapsed-notes"; }
        if(this.tagsCollapsed) { appClass += " collapsed-tags"; }
        this.$scope.appClass = appClass;
      }
    });
  }

  loadAfterUnlock() {
    this.openDatabase();
    this.authManager.loadInitialData();
    this.preferencesManager.load();
    this.addSyncStatusObserver();
    this.configureKeyRequestHandler();
    this.addSyncEventHandler();
    this.addSignOutObserver();
    this.loadLocalData();
  }

  openDatabase() {
    this.dbManager.setLocked(false);
    this.dbManager.openDatabase({
      onUpgradeNeeded: () => {
        /**
         * New database, delete syncToken so that items
         * can be refetched entirely from server
         */
        this.syncManager.clearSyncToken();
        this.syncManager.sync();
      }
    });
  }

  addSyncStatusObserver() {
    this.syncStatusObserver = this.syncManager.registerSyncStatusObserver((status) => {
      if(status.retrievedCount > 20) {
        const text = `Downloading ${status.retrievedCount} items. Keep app open.`;
        this.syncStatus = this.statusManager.replaceStatusWithString(
          this.syncStatus,
          text
        );
        this.showingDownloadStatus = true;
      } else if(this.showingDownloadStatus) {
        this.showingDownloadStatus = false;
        const text = "Download Complete.";
        this.syncStatus = this.statusManager.replaceStatusWithString(
          this.syncStatus,
          text
        );
        setTimeout(() => {
          this.syncStatus = this.statusManager.removeStatus(this.syncStatus);
        }, 2000);
      } else if(status.total > 20) {
        this.uploadSyncStatus = this.statusManager.replaceStatusWithString(
          this.uploadSyncStatus,
          `Syncing ${status.current}/${status.total} items...`
        );
      } else if(this.uploadSyncStatus) {
        this.uploadSyncStatus = this.statusManager.removeStatus(
          this.uploadSyncStatus
        );
      }
    });
  }

  configureKeyRequestHandler() {
    this.syncManager.setKeyRequestHandler(async () => {
      const offline = this.authManager.offline();
      const authParams = (
        offline
        ? this.passcodeManager.passcodeAuthParams()
        : await this.authManager.getAuthParams()
      );
      const keys = offline
        ? this.passcodeManager.keys()
        : await this.authManager.keys();
      return {
        keys: keys,
        offline: offline,
        auth_params: authParams
      };
    });
  }

  addSyncEventHandler() {
    let lastShownDate;
    this.syncManager.addEventHandler((syncEvent, data) => {
      this.$rootScope.$broadcast(
        syncEvent,
        data || {}
      );
      if(syncEvent === 'sync-session-invalid') {
        /** Don't show repeatedly; at most 30 seconds in between */
        const SHOW_INTERVAL = 30;
        const lastShownSeconds = (new Date() - lastShownDate) / 1000;
        if(!lastShownDate || lastShownSeconds > SHOW_INTERVAL) {
          lastShownDate = new Date();
          setTimeout(() => {
            this.alertManager.alert({
              text: STRING_SESSION_EXPIRED
            });
          }, 500);
        }
      } else if(syncEvent === 'sync-exception') {
        this.alertManager.alert({
          text: StringSyncException(data)
        });
      }
    });
  }

  loadLocalData() {
    const encryptionEnabled = this.authManager.user || this.passcodeManager.hasPasscode();
    this.syncStatus = this.statusManager.addStatusFromString(
      encryptionEnabled ? "Decrypting items..." : "Loading items..."
    );
    const incrementalCallback = (current, total) => {
      const notesString = `${current}/${total} items...`;
      const status = encryptionEnabled
        ? `Decrypting ${notesString}`
        : `Loading ${notesString}`;
      this.syncStatus = this.statusManager.replaceStatusWithString(
        this.syncStatus,
        status
      );
    };
    this.syncManager.loadLocalItems({incrementalCallback}).then(() => {
      this.$timeout(() => {
        this.$rootScope.$broadcast("initial-data-loaded");
        this.syncStatus = this.statusManager.replaceStatusWithString(
          this.syncStatus,
          "Syncing..."
        );
        this.syncManager.sync({
          performIntegrityCheck: true
        }).then(() => {
          this.syncStatus = this.statusManager.removeStatus(this.syncStatus);
        });
        setInterval(() => {
          this.syncManager.sync();
        }, AUTO_SYNC_INTERVAL);
      });
    });
  }

  addSignOutObserver() {
    this.authManager.addEventHandler((event) => {
      if(event === SFAuthManager.DidSignOutEvent) {
        this.modelManager.handleSignout();
        this.syncManager.handleSignout();
      }
    });
  }

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
      if(event.dataTransfer.files.length > 0) {
        event.preventDefault();
        this.alertManager.alert({
          text: STRING_DEFAULT_FILE_ERROR
        });
      }
    }, false);
  }

  async handleAutoSignInFromParams() {
    const params = this.$location.search();
    const server = params.server;
    const email = params.email;
    const password = params.pw;
    if (!server || !email || !password) return;

    if (this.authManager.offline()) {
      const { error } = await this.authManager.login(
        server,
        email,
        password,
        false,
        false,
        {}
      );
      if (!error) {
        window.location.reload();
      }
    } else if (
      this.authManager.user.email === email &&
      (await this.syncManager.getServerURL()) === server
    ) {
      /** Already signed in, return */
      // eslint-disable-next-line no-useless-return
      return;
    } else {
      this.authManager.signout(true);
      window.location.reload();
    }
  }
}

export class Root {
  constructor() {
    this.template = template;
    this.controller = RootCtrl;
  }
}
