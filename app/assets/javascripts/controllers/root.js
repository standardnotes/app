import { Challenges, ChallengeResponse } from 'snjs';
import { getPlatformString } from '@/utils';
import template from '%/root.pug';
import { AppStateEvents } from '@/state';
import angular from 'angular';
import {
  PANEL_NAME_NOTES,
  PANEL_NAME_TAGS
} from '@/controllers/constants';
import {
  // STRING_SESSION_EXPIRED,
  STRING_DEFAULT_FILE_ERROR,
  // StringSyncException
} from '@/strings';
import { PureCtrl } from './abstract/pure_ctrl';

class RootCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $compile,
    $location,
    $scope,
    $rootScope,
    $timeout,
    application,
    appState,
    desktopManager,
    lockManager,
    preferencesManager /** Unused below, required to load globally */,
    themeManager,
    statusManager,
  ) {
    super($scope, $timeout, application, appState);
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.desktopManager = desktopManager;
    this.lockManager = lockManager;
    this.statusManager = statusManager;
    this.themeManager = themeManager;
    this.platformString = getPlatformString();
    this.state = { appClass: '' };
    this.loadApplication();
    this.addDragDropHandlers();
    this.lockScreenPuppet = {
      focusInput: () => { }
    };
  }

  onAppStart() {
    super.onAppStart();
    this.overrideComponentManagerFunctions();
    this.application.componentManager.setDesktopManager(this.desktopManager);
    this.setState({
      ready: true,
      needsUnlock: this.application.hasPasscode()
    });
  }

  onAppLaunch() {
    super.onAppLaunch();
    this.setState({ needsUnlock: false });
    this.application.registerService(this.themeManager);
    this.handleAutoSignInFromParams();
  }

  async watchLockscreenValue() {
    return new Promise((resolve) => {
      const onLockscreenValue = (value) => {
        const response = new ChallengeResponse({
          challenge: Challenges.LocalPasscode,
          value: value
        });
        resolve([response]);
      };
      this.setState({ onLockscreenValue });
    });
  }

  async loadApplication() {
    await this.application.prepareForLaunch({
      callbacks: {
        requiresChallengeResponses: async (challenges) => {
          if (challenges.includes(Challenges.LocalPasscode)) {
            this.setState({ needsUnlock: true });
          }
          return this.watchLockscreenValue();
        },
        handleChallengeFailures: (responses) => {
          for (const response of responses) {
            if (response.challenge === Challenges.LocalPasscode) {
              this.application.alertService.alert({
                text: "Invalid passcode. Please try again.",
                onClose: () => {
                  this.lockScreenPuppet.focusInput();
                }
              });
            }
          }
        }
      }
    });
    await this.application.launch();
  }

  onUpdateAvailable() {
    this.$rootScope.$broadcast('new-update-available');
  };

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

  overrideComponentManagerFunctions() {
    function openModalComponent(component) {
      const scope = this.$rootScope.$new(true);
      scope.component = component;
      const el = this.$compile("<component-modal component='component' class='sk-modal'></component-modal>")(scope);
      angular.element(document.body).append(el);
    }
    function presentPermissionsDialog(dialog) {
      const scope = this.$rootScope.$new(true);
      scope.permissionsString = dialog.permissionsString;
      scope.component = dialog.component;
      scope.callback = dialog.callback;
      const el = this.$compile("<permissions-modal component='component' permissions-string='permissionsString' callback='callback' class='sk-modal'></permissions-modal>")(scope);
      angular.element(document.body).append(el);
    }
    this.application.componentManager.openModalComponent = openModalComponent.bind(this);
    this.application.componentManager.presentPermissionsDialog = presentPermissionsDialog.bind(this);
  }

  // addSyncStatusObserver() {
  //   this.syncStatusObserver = syncManager.registerSyncStatusObserver((status) => {
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
  //   syncManager.addEventHandler((syncEvent, data) => {
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
  //           this.alertService.alert({
  //             text: STRING_SESSION_EXPIRED
  //           });
  //         }, 500);
  //       }
  //     } else if (syncEvent === 'sync-exception') {
  //       this.alertService.alert({
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
  //   syncManager.loadLocalItems({ incrementalCallback }).then(() => {
  //     this.$timeout(() => {
  //       this.$rootScope.$broadcast("initial-data-loaded");
  //       this.syncStatus = this.statusManager.replaceStatusWithString(
  //         this.syncStatus,
  //         "Syncing..."
  //       );
  //       syncManager.sync({
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
        this.application.alertService.alert({
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

export class Root {
  constructor() {
    this.template = template;
    this.controller = RootCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
