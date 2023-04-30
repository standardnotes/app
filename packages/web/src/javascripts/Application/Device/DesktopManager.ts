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
  DesktopClientRequiresWebMethods,
  DesktopDeviceInterface,
  WebApplicationInterface,
  WebAppEvent,
} from '@standardnotes/snjs'

export class DesktopManager
  extends ApplicationService
  implements DesktopManagerInterface, DesktopClientRequiresWebMethods
{
  updateObservers: {
    callback: (component: SNComponent) => void
  }[] = []

  dataLoaded = false
  lastSearchedText?: string

  private textBackupsInterval: ReturnType<typeof setInterval> | undefined
  private needsInitialTextBackup = false

  constructor(application: WebApplicationInterface, private device: DesktopDeviceInterface) {
    super(application, new InternalEventBus())
  }

  beginTextBackupsTimer() {
    if (this.textBackupsInterval) {
      clearInterval(this.textBackupsInterval)
    }

    this.needsInitialTextBackup = true

    const hoursInterval = 12
    const seconds = hoursInterval * 60 * 60
    const milliseconds = seconds * 1000
    this.textBackupsInterval = setInterval(this.saveDesktopBackup, milliseconds)
  }

  get webApplication() {
    return this.application as WebApplicationInterface
  }

  override deinit() {
    this.updateObservers.length = 0
    super.deinit()
  }

  override async onAppEvent(eventName: ApplicationEvent) {
    super.onAppEvent(eventName).catch(console.error)
    if (eventName === ApplicationEvent.LocalDataLoaded) {
      this.dataLoaded = true
      void this.device.isLegacyTextBackupsEnabled().then((isEnabled) => {
        if (isEnabled) {
          this.beginTextBackupsTimer()
        }
      })
    } else if (eventName === ApplicationEvent.MajorDataChange) {
      void this.saveDesktopBackup()
    }
  }

  async saveDesktopBackup() {
    this.webApplication.notifyWebEvent(WebAppEvent.BeganBackupDownload)

    const data = await this.getBackupFile()
    await this.device.saveTextBackupData(this.application.identifier, data)

    this.webApplication.notifyWebEvent(WebAppEvent.EndedBackupDownload, { success: true })
  }

  private async getBackupFile(): Promise<string | undefined> {
    const encrypted = this.application.hasProtectionSources()
    const data = encrypted
      ? await this.application.createEncryptedBackupFileForAutomatedDesktopBackups()
      : await this.application.createDecryptedBackupFile()

    if (data) {
      return JSON.stringify(data, null, 2)
    }

    return undefined
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

  registerUpdateObserver(callback: (component: SNComponent) => void): () => void {
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
    this.webApplication.notifyWebEvent(WebAppEvent.WindowDidFocus)
  }

  windowLostFocus(): void {
    this.webApplication.notifyWebEvent(WebAppEvent.WindowDidBlur)

    if (this.needsInitialTextBackup) {
      this.needsInitialTextBackup = false
      void this.saveDesktopBackup()
    }
  }

  async onComponentInstallationComplete(componentData: DecryptedTransferPayload<ComponentContent>) {
    const component = this.application.items.findItem(componentData.uuid)
    if (!component) {
      return
    }

    const updatedComponent = await this.application.mutator.changeAndSaveItem(
      component,
      (m) => {
        const mutator = m as ComponentMutator
        // eslint-disable-next-line camelcase
        mutator.local_url = componentData.content.local_url as string
        // eslint-disable-next-line camelcase
        mutator.package_info = componentData.content.package_info
        mutator.setAppDataItem(AppDataField.ComponentInstallError, undefined)
      },
      undefined,
    )

    for (const observer of this.updateObservers) {
      observer.callback(updatedComponent as SNComponent)
    }
  }
}
