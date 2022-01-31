/* eslint-disable camelcase */
import {
  SNComponent,
  ComponentMutator,
  AppDataField,
  EncryptionIntent,
  ApplicationService,
  ApplicationEvent,
  removeFromArray,
  DesktopManagerInterface,
  PayloadSource,
} from '@standardnotes/snjs';

import { WebAppEvent, WebApplication } from '@/ui_models/application';
import { isDesktopApplication } from '@/utils';
import { Bridge } from './bridge';

/**
 * An interface used by the Desktop application to interact with SN
 */
export class DesktopManager
  extends ApplicationService
  implements DesktopManagerInterface
{
  updateObservers: {
    callback: (component: SNComponent) => void;
  }[] = [];

  isDesktop = isDesktopApplication();
  dataLoaded = false;
  lastSearchedText?: string;

  constructor(application: WebApplication, private bridge: Bridge) {
    super(application);
  }

  get webApplication() {
    return this.application as WebApplication;
  }

  deinit() {
    this.updateObservers.length = 0;
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

  getExtServerHost(): string {
    console.assert(!!this.bridge.extensionsServerHost, 'extServerHost is null');
    return this.bridge.extensionsServerHost!;
  }

  /**
   * Sending a component in its raw state is really slow for the desktop app
   * Keys are not passed into ItemParams, so the result is not encrypted
   */
  convertComponentForTransmission(component: SNComponent) {
    return this.application.protocolService.payloadByEncryptingPayload(
      component.payloadRepresentation(),
      EncryptionIntent.FileDecrypted
    );
  }

  // All `components` should be installed
  syncComponentsInstallation(components: SNComponent[]) {
    if (!this.isDesktop) {
      return;
    }
    Promise.all(
      components.map((component) => {
        return this.convertComponentForTransmission(component);
      })
    ).then((payloads) => {
      this.bridge.syncComponents(
        payloads.filter(
          (payload) => !payload.errorDecrypting && !payload.waitingForKey
        )
      );
    });
  }

  registerUpdateObserver(callback: (component: SNComponent) => void) {
    const observer = {
      callback: callback,
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

  desktop_windowGainedFocus(): void {
    this.webApplication.notifyWebEvent(WebAppEvent.DesktopWindowGainedFocus);
  }

  desktop_windowLostFocus(): void {
    this.webApplication.notifyWebEvent(WebAppEvent.DesktopWindowLostFocus);
  }

  async desktop_onComponentInstallationComplete(
    componentData: any,
    error: any
  ) {
    const component = this.application.findItem(componentData.uuid);
    if (!component) {
      return;
    }
    const updatedComponent = await this.application.changeAndSaveItem(
      component.uuid,
      (m) => {
        const mutator = m as ComponentMutator;
        if (error) {
          mutator.setAppDataItem(AppDataField.ComponentInstallError, error);
        } else {
          mutator.local_url = componentData.content.local_url;
          mutator.package_info = componentData.content.package_info;
          mutator.setAppDataItem(AppDataField.ComponentInstallError, undefined);
        }
      },
      undefined,
      PayloadSource.DesktopInstalled
    );

    for (const observer of this.updateObservers) {
      observer.callback(updatedComponent as SNComponent);
    }
  }

  async desktop_requestBackupFile() {
    const data = await this.application.createBackupFile(
      this.application.hasProtectionSources()
        ? EncryptionIntent.FileEncrypted
        : EncryptionIntent.FileDecrypted
    );
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
