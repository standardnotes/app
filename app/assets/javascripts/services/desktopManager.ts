import { SNComponent, PurePayload, ComponentMutator, AppDataField, ContentType } from '@standardnotes/snjs';
/* eslint-disable camelcase */
import { WebApplication } from '@/ui_models/application';
// An interface used by the Desktop app to interact with SN
import { isDesktopApplication } from '@/utils';
import { EncryptionIntent, ApplicationService, ApplicationEvent, removeFromArray } from '@standardnotes/snjs';
import { Bridge } from './bridge';

type UpdateObserverCallback = (component: SNComponent) => void
type ComponentActivationCallback = (payload: PurePayload) => void
type ComponentActivationObserver = {
  id: string;
  callback: ComponentActivationCallback;
}

export class DesktopManager extends ApplicationService {

  $rootScope: ng.IRootScopeService
  $timeout: ng.ITimeoutService
  componentActivationObservers: ComponentActivationObserver[] = []
  updateObservers: {
    callback: UpdateObserverCallback;
  }[] = [];

  isDesktop = isDesktopApplication();

  dataLoaded = false
  lastSearchedText?: string
  private removeComponentObserver?: () => void;

  constructor(
    $rootScope: ng.IRootScopeService,
    $timeout: ng.ITimeoutService,
    application: WebApplication,
    private bridge: Bridge,
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
    this.removeComponentObserver?.();
    this.removeComponentObserver = undefined;
    super.deinit();
  }

  async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName);
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.dataLoaded = true;
      this.bridge.onInitialDataLoad();
    } else if (eventName === ApplicationEvent.MajorDataChange) {
      this.bridge.onMajorDataChange();
    }
  }

  saveBackup() {
    this.bridge.onMajorDataChange();
  }

  getExtServerHost() {
    console.assert(
      this.bridge.extensionsServerHost,
      'extServerHost is null'
    );
    return this.bridge.extensionsServerHost;
  }

  /**
   * Sending a component in its raw state is really slow for the desktop app
   * Keys are not passed into ItemParams, so the result is not encrypted
   */
  convertComponentForTransmission(component: SNComponent) {
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
      this.bridge.syncComponents(
        payloads.filter(payload =>
          !payload.errorDecrypting && !payload.waitingForKey
        )
      );
    });
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
    this.bridge.onSearch(text);
  }

  redoSearch() {
    if (this.lastSearchedText) {
      this.searchText(this.lastSearchedText);
    }
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
      });

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

  async desktop_requestBackupFile() {
    const data = this.application!.createBackupFile(EncryptionIntent.FileEncrypted);
    if (data) {
      return JSON.stringify(data, null, 2);
    }
  }

  desktop_didBeginBackup() {
    this.webApplication.getAppState().beganBackupDownload();
  }

  desktop_didFinishBackup(success: boolean) {
    this.webApplication.getAppState().endedBackupDownload(success);
  }
}
