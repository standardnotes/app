import { SNComponent, PurePayload, ComponentMutator, AppDataField } from 'snjs';
/* eslint-disable camelcase */
import { WebApplication } from '@/application';
// An interface used by the Desktop app to interact with SN
import { isDesktopApplication } from '@/utils';
import { EncryptionIntent, ApplicationService, ApplicationEvent, removeFromArray } from 'snjs';

type UpdateObserverCallback = (component: SNComponent) => void
type ComponentActivationCallback = (payload: PurePayload) => void
type ComponentActivationObserver = {
  id: string,
  callback: ComponentActivationCallback
}

export class DesktopManager extends ApplicationService {

  $rootScope: ng.IRootScopeService
  $timeout: ng.ITimeoutService
  componentActivationObservers: ComponentActivationObserver[] = []
  updateObservers: {
    callback: UpdateObserverCallback
  }[] = []
  isDesktop = isDesktopApplication();

  dataLoaded = false
  dataLoadHandler?: () => void
  majorDataChangeHandler?: () => void
  extServerHost?: string
  installationSyncHandler?: (payloads: PurePayload[]) => void
  installComponentHandler?: (payload: PurePayload) => void
  lastSearchedText?: string
  searchHandler?: (text?: string) => void

  constructor(
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    application: WebApplication
  ) {
    super(application);
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
  }

  get webApplication() {
    return this.application as WebApplication;
  }

  deinit() {
    this.componentActivationObservers.length = 0;
    this.updateObservers.length = 0;
    super.deinit();
  }

  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.dataLoaded = true;
      if (this.dataLoadHandler) {
        this.dataLoadHandler();
      }
    } else if (eventName === ApplicationEvent.MajorDataChange) {
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
  async convertComponentForTransmission(component: SNComponent) {
    return this.application!.protocolService!.payloadByEncryptingPayload(
      component.payloadRepresentation(),
      EncryptionIntent.FileDecrypted
    );
  }

  // All `components` should be installed
  syncComponentsInstallation(components: SNComponent[]) {
    if (!this.isDesktop) {
      return;
    }
    Promise.all(components.map((component) => {
      return this.convertComponentForTransmission(component);
    })).then((payloads) => {
      this.installationSyncHandler!(payloads);
    });
  }

  async installComponent(component: SNComponent) {
    this.installComponentHandler!(
      await this.convertComponentForTransmission(component)
    );
  }

  registerUpdateObserver(callback: UpdateObserverCallback) {
    const observer = {
      callback: callback
    };
    this.updateObservers.push(observer);
    return () => {
      removeFromArray(this.updateObservers, observer);
    };
  }

  searchText(text?: string) {
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
  desktop_setSearchHandler(handler: (text?: string) => void) {
    this.searchHandler = handler;
  }

  desktop_windowGainedFocus() {
    this.$rootScope.$broadcast('window-gained-focus');
  }

  desktop_windowLostFocus() {
    this.$rootScope.$broadcast('window-lost-focus');
  }

  async desktop_onComponentInstallationComplete(
    componentData: any,
    error: any
  ) {
    const component = this.application!.findItem(componentData.uuid);
    if (!component) {
      return;
    }
    const updatedComponent = await this.application!.changeAndSaveItem(
      component.uuid,
      (m) => {
        const mutator = m as ComponentMutator;
        if (error) {
          mutator.setAppDataItem(
            AppDataField.ComponentInstallError,
            error
          );
        } else {
          mutator.local_url = componentData.content.local_url;
          mutator.package_info = componentData.content.package_info;
          mutator.setAppDataItem(
            AppDataField.ComponentInstallError,
            undefined
          );
        }
      })

    this.$timeout(() => {
      for (const observer of this.updateObservers) {
        observer.callback(updatedComponent as SNComponent);
      }
    });
  }

  desktop_registerComponentActivationObserver(callback: ComponentActivationCallback) {
    const observer = { id: `${Math.random}`, callback: callback };
    this.componentActivationObservers.push(observer);
    return observer;
  }

  desktop_deregisterComponentActivationObserver(observer: ComponentActivationObserver) {
    removeFromArray(this.componentActivationObservers, observer);
  }

  /* Notify observers that a component has been registered/activated */
  async notifyComponentActivation(component: SNComponent) {
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
  desktop_setExtServerHost(host: string) {
    this.extServerHost = host;
    this.webApplication.getAppState().desktopExtensionsReady();
  }

  desktop_setComponentInstallationSyncHandler(handler: (payloads: PurePayload[]) => void) {
    this.installationSyncHandler = handler;
  }

  desktop_setInstallComponentHandler(handler: (payload: PurePayload) => void) {
    this.installComponentHandler = handler;
  }

  desktop_setInitialDataLoadHandler(handler: () => void) {
    this.dataLoadHandler = handler;
    if (this.dataLoaded) {
      this.dataLoadHandler();
    }
  }

  async desktop_requestBackupFile(callback: (data: any) => void) {
    const data = await this.application!.createBackupFile(
      undefined,
      undefined,
      true
    );
    callback(data);
  }

  desktop_setMajorDataChangeHandler(handler: () => void) {
    this.majorDataChangeHandler = handler;
  }

  desktop_didBeginBackup() {
    this.webApplication.getAppState().beganBackupDownload();
  }

  desktop_didFinishBackup(success: boolean) {
    this.webApplication.getAppState().endedBackupDownload(success);
  }
}
