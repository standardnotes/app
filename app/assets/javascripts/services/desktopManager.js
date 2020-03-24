/* eslint-disable camelcase */
// An interface used by the Desktop app to interact with SN
import { isDesktopApplication } from '@/utils';
import { EncryptionIntents, ApplicationService, ApplicationEvents, removeFromArray } from 'snjs';

const COMPONENT_DATA_KEY_INSTALL_ERROR = 'installError';
const COMPONENT_CONTENT_KEY_PACKAGE_INFO = 'package_info';
const COMPONENT_CONTENT_KEY_LOCAL_URL = 'local_url';

export class DesktopManager extends ApplicationService {
  constructor(
    $rootScope,
    $timeout,
    application
  ) {
    super(application);
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.componentActivationObservers = [];
    this.updateObservers = [];
    this.isDesktop = isDesktopApplication();
  }

  deinit() {
    this.componentActivationObservers.length = 0;
    this.updateObservers.length = 0;
    super.deinit();
  }

  /** @override */
  onAppEvent(eventName) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvents.LocalDataLoaded) {
      this.dataLoaded = true;
      if (this.dataLoadHandler) {
        this.dataLoadHandler();
      }
    } else if (eventName === ApplicationEvents.MajorDataChange) {
      if (this.majorDataChangeHandler) {
        this.majorDataChangeHandler();
      }
    }
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

  /**
   * Sending a component in its raw state is really slow for the desktop app
   * Keys are not passed into ItemParams, so the result is not encrypted
   */
  async convertComponentForTransmission(component) {
    return this.application.protocolService.payloadByEncryptingPayload({
      payload: component.payloadRepresentation(),
      intent: EncryptionIntents.FileDecrypted
    });
  }

  // All `components` should be installed
  syncComponentsInstallation(components) {
    if (!this.isDesktop) {
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
    return () => {
      removeFromArray(this.updateObservers, observer);
    };
  }

  searchText(text) {
    if (!this.isDesktop) {
      return;
    }
    this.lastSearchedText = text;
    this.searchHandler && this.searchHandler(text);
  }

  redoSearch() {
    if (this.lastSearchedText) {
      this.searchText(this.lastSearchedText);
    }
  }

  // Pass null to cancel search
  desktop_setSearchHandler(handler) {
    this.searchHandler = handler;
  }

  desktop_windowGainedFocus() {
    this.$rootScope.$broadcast('window-gained-focus');
  }

  desktop_windowLostFocus() {
    this.$rootScope.$broadcast('window-lost-focus');
  }

  async desktop_onComponentInstallationComplete(componentData, error) {
    const component = await this.application.findItem({ uuid: componentData.uuid });
    if (!component) {
      return;
    }
    if (error) {
      component.setAppDataItem(
        COMPONENT_DATA_KEY_INSTALL_ERROR,
        error
      );
    } else {
      const permissableKeys = [
        COMPONENT_CONTENT_KEY_PACKAGE_INFO,
        COMPONENT_CONTENT_KEY_LOCAL_URL
      ];
      for (const key of permissableKeys) {
        component[key] = componentData.content[key];
      }
      component.setAppDataItem(
        COMPONENT_DATA_KEY_INSTALL_ERROR,
        null
      );
    }
    this.application.saveItem({ item: component });
    this.$timeout(() => {
      for (const observer of this.updateObservers) {
        observer.callback(component);
      }
    });
  }

  desktop_registerComponentActivationObserver(callback) {
    const observer = { id: Math.random, callback: callback };
    this.componentActivationObservers.push(observer);
    return observer;
  }

  desktop_deregisterComponentActivationObserver(observer) {
    removeFromArray(this.componentActivationObservers, observer);
  }

  /* Notify observers that a component has been registered/activated */
  async notifyComponentActivation(component) {
    const serializedComponent = await this.convertComponentForTransmission(
      component
    );
    this.$timeout(() => {
      for (const observer of this.componentActivationObservers) {
        observer.callback(serializedComponent);
      }
    });
  }

  /* Used to resolve 'sn://' */
  desktop_setExtServerHost(host) {
    this.extServerHost = host;
    this.application.getAppState().desktopExtensionsReady();
  }

  desktop_setComponentInstallationSyncHandler(handler) {
    this.installationSyncHandler = handler;
  }

  desktop_setInstallComponentHandler(handler) {
    this.installComponentHandler = handler;
  }

  desktop_setInitialDataLoadHandler(handler) {
    this.dataLoadHandler = handler;
    if (this.dataLoaded) {
      this.dataLoadHandler();
    }
  }

  async desktop_requestBackupFile(callback) {
    const data = await this.application.createBackupFile({
      returnIfEmpty: true
    });
    callback(data);
  }

  desktop_setMajorDataChangeHandler(handler) {
    this.majorDataChangeHandler = handler;
  }

  desktop_didBeginBackup() {
    this.application.getAppState().beganBackupDownload();
  }

  desktop_didFinishBackup(success) {
    this.application.getAppState().endedBackupDownload({
      success: success
    });
  }
}
