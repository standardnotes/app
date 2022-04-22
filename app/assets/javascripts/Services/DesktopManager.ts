import {
  SNComponent,
  ComponentMutator,
  AppDataField,
  ApplicationService,
  ApplicationEvent,
  removeFromArray,
  DesktopManagerInterface,
  InternalEventBus,
  DecryptedTransferPayload,
  ComponentContent,
  assert,
} from '@standardnotes/snjs'
import { WebAppEvent, WebApplication } from '@/UIModels/Application'
import { DesktopDeviceInterface } from '../Device/DesktopDeviceInterface'
import { DesktopCommunicationReceiver } from '@/Device/DesktopWebCommunication'

export class DesktopManager
  extends ApplicationService
  implements DesktopManagerInterface, DesktopCommunicationReceiver
{
  updateObservers: {
    callback: (component: SNComponent) => void
  }[] = []

  dataLoaded = false
  lastSearchedText?: string

  constructor(application: WebApplication, private device: DesktopDeviceInterface) {
    super(application, new InternalEventBus())
  }

  get webApplication() {
    return this.application as WebApplication
  }

  override deinit() {
    this.updateObservers.length = 0
    super.deinit()
  }

  override async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName).catch(console.error)
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.dataLoaded = true
      this.device.onInitialDataLoad()
    } else if (eventName === ApplicationEvent.MajorDataChange) {
      this.device.onMajorDataChange()
    }
  }

  saveBackup() {
    this.device.onMajorDataChange()
  }

  getExtServerHost(): string {
    assert(this.device.extensionsServerHost)

    return this.device.extensionsServerHost
  }

  /**
   * Sending a component in its raw state is really slow for the desktop app
   * Keys are not passed into ItemParams, so the result is not encrypted
   */
  convertComponentForTransmission(component: SNComponent) {
    return component.payloadRepresentation().ejected()
  }

  // All `components` should be installed
  syncComponentsInstallation(components: SNComponent[]) {
    Promise.all(
      components.map((component) => {
        return this.convertComponentForTransmission(component)
      }),
    )
      .then((payloads) => {
        this.device.syncComponents(payloads)
      })
      .catch(console.error)
  }

  registerUpdateObserver(callback: (component: SNComponent) => void) {
    const observer = {
      callback: callback,
    }
    this.updateObservers.push(observer)
    return () => {
      removeFromArray(this.updateObservers, observer)
    }
  }

  searchText(text?: string) {
    this.lastSearchedText = text
    this.device.onSearch(text)
  }

  redoSearch() {
    if (this.lastSearchedText) {
      this.searchText(this.lastSearchedText)
    }
  }

  updateAvailable(): void {
    this.webApplication.notifyWebEvent(WebAppEvent.NewUpdateAvailable)
  }

  windowGainedFocus(): void {
    this.webApplication.notifyWebEvent(WebAppEvent.DesktopWindowGainedFocus)
  }

  windowLostFocus(): void {
    this.webApplication.notifyWebEvent(WebAppEvent.DesktopWindowLostFocus)
  }

  async onComponentInstallationComplete(
    componentData: DecryptedTransferPayload<ComponentContent>,
    error: unknown,
  ) {
    const component = this.application.items.findItem(componentData.uuid)
    if (!component) {
      return
    }

    const updatedComponent = await this.application.mutator.changeAndSaveItem(
      component,
      (m) => {
        const mutator = m as ComponentMutator
        if (error) {
          mutator.setAppDataItem(AppDataField.ComponentInstallError, error)
        } else {
          // eslint-disable-next-line camelcase
          mutator.local_url = componentData.content.local_url as string
          // eslint-disable-next-line camelcase
          mutator.package_info = componentData.content.package_info
          mutator.setAppDataItem(AppDataField.ComponentInstallError, undefined)
        }
      },
      undefined,
    )

    for (const observer of this.updateObservers) {
      observer.callback(updatedComponent as SNComponent)
    }
  }

  async requestBackupFile(): Promise<string | undefined> {
    const encrypted = this.application.hasProtectionSources()
    const data = encrypted
      ? await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
      : await this.application.createDecryptedBackupFile()

    if (data) {
      return JSON.stringify(data, null, 2)
    }

    return undefined
  }

  didBeginBackup() {
    this.webApplication.getAppState().beganBackupDownload()
  }

  didFinishBackup(success: boolean) {
    this.webApplication.getAppState().endedBackupDownload(success)
  }
}
