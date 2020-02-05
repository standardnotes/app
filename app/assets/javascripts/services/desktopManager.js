// An interface used by the Desktop app to interact with SN
import _ from 'lodash';
import { isDesktopApplication } from '@/utils';
import { SFItemParams, SFModelManager } from 'snjs';

const COMPONENT_DATA_KEY_INSTALL_ERROR = 'installError';
const COMPONENT_CONTENT_KEY_PACKAGE_INFO = 'package_info';
const COMPONENT_CONTENT_KEY_LOCAL_URL = 'local_url';

export class DesktopManager {
  /* @ngInject */
  constructor(
    $rootScope,
    $timeout,
    modelManager,
    syncManager,
    authManager,
    lockManager,
    appState
  ) {
    this.lockManager = lockManager;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.syncManager = syncManager;
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.timeout = $timeout;
    this.updateObservers = [];
    this.componentActivationObservers = [];

    this.isDesktop = isDesktopApplication();

    $rootScope.$on("initial-data-loaded", () => {
      this.dataLoaded = true;
      if(this.dataLoadHandler) {
        this.dataLoadHandler();
      }
    });

    $rootScope.$on("major-data-change", () => {
      if(this.majorDataChangeHandler) {
        this.majorDataChangeHandler();
      }
    });
  }

  saveBackup() {
    this.majorDataChangeHandler && this.majorDataChangeHandler();
  }

  getExtServerHost() {
    console.assert(
      this.extServerHost,
      'extServerHost is null'
    );
    return this.extServerHost;
  }

  /*
    Sending a component in its raw state is really slow for the desktop app
    Keys are not passed into ItemParams, so the result is not encrypted
   */
  async convertComponentForTransmission(component) {
    return new SFItemParams(component).paramsForExportFile(true);
  }

  // All `components` should be installed
  syncComponentsInstallation(components) {
    if(!this.isDesktop) {
      return;
    }
    Promise.all(components.map((component) => {
      return this.convertComponentForTransmission(component);
    })).then((data) => {
      this.installationSyncHandler(data);
    });
  }

  async installComponent(component) {
    this.installComponentHandler(
      await this.convertComponentForTransmission(component)
    );
  }

  registerUpdateObserver(callback) {
    const observer = {
      callback: callback
    };
    this.updateObservers.push(observer);
    return observer;
  }

  searchText(text) {
    if(!this.isDesktop) {
      return;
    }
    this.lastSearchedText = text;
    this.searchHandler && this.searchHandler(text);
  }

  redoSearch()  {
    if(this.lastSearchedText) {
      this.searchText(this.lastSearchedText);
    }
  }

  deregisterUpdateObserver(observer) {
    _.pull(this.updateObservers, observer);
  }

  // Pass null to cancel search
  desktop_setSearchHandler(handler) {
    this.searchHandler = handler;
  }

  desktop_windowGainedFocus() {
    this.$rootScope.$broadcast("window-gained-focus");
  }

  desktop_windowLostFocus() {
    this.$rootScope.$broadcast("window-lost-focus");
  }

  desktop_onComponentInstallationComplete(componentData, error) {
    const component = this.modelManager.findItem(componentData.uuid);
    if(!component) {
      return;
    }
    if(error) {
      component.setAppDataItem(
        COMPONENT_DATA_KEY_INSTALL_ERROR,
        error
      );
    } else {
      const permissableKeys = [
        COMPONENT_CONTENT_KEY_PACKAGE_INFO,
        COMPONENT_CONTENT_KEY_LOCAL_URL
      ];
      for(const key of permissableKeys) {
        component[key] = componentData.content[key];
      }
      this.modelManager.notifySyncObserversOfModels(
        [component],
        SFModelManager.MappingSourceDesktopInstalled
      );
      component.setAppDataItem(
        COMPONENT_DATA_KEY_INSTALL_ERROR,
        null
      );
    }
    this.modelManager.setItemDirty(component);
    this.syncManager.sync();
    this.timeout(() => {
      for(const observer of this.updateObservers) {
        observer.callback(component);
      }
    });
  }

  desktop_registerComponentActivationObserver(callback) {
    const observer = {id: Math.random, callback: callback};
    this.componentActivationObservers.push(observer);
    return observer;
  }

  desktop_deregisterComponentActivationObserver(observer) {
    _.pull(this.componentActivationObservers, observer);
  }

  /* Notify observers that a component has been registered/activated */
  async notifyComponentActivation(component) {
    const serializedComponent = await this.convertComponentForTransmission(
      component
    );
    this.timeout(() => {
      for(const observer of this.componentActivationObservers) {
        observer.callback(serializedComponent);
      }
    });
  }

  /* Used to resolve "sn://" */
  desktop_setExtServerHost(host) {
    this.extServerHost = host;
    this.appState.desktopExtensionsReady();
  }

  desktop_setComponentInstallationSyncHandler(handler) {
    this.installationSyncHandler = handler;
  }

  desktop_setInstallComponentHandler(handler) {
    this.installComponentHandler = handler;
  }

  desktop_setInitialDataLoadHandler(handler) {
    this.dataLoadHandler = handler;
    if(this.dataLoaded) {
      this.dataLoadHandler();
    }
  }

  async desktop_requestBackupFile(callback) {
    let keys, authParams;
    if(this.authManager.offline() && this.lockManager.hasPasscode()) {
      keys = this.lockManager.keys();
      authParams = this.lockManager.passcodeAuthParams();
    } else {
      keys = await this.authManager.keys();
      authParams = await this.authManager.getAuthParams();
    }
    const nullOnEmpty = true;
    this.modelManager.getAllItemsJSONData(
      keys,
      authParams,
      nullOnEmpty
    ).then((data) => {
      callback(data);
    });
  }

  desktop_setMajorDataChangeHandler(handler) {
    this.majorDataChangeHandler = handler;
  }

  desktop_didBeginBackup() {
    this.appState.beganBackupDownload();
  }

  desktop_didFinishBackup(success) {
    this.appState.endedBackupDownload({
      success: success
    });
  }
}
