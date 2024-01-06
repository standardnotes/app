import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import {
  ComponentItem,
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
  WebAppEvent,
  BackupServiceInterface,
  DesktopWatchedDirectoriesChanges,
  ComponentInterface,
  PayloadEmitSource,
} from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export class DesktopManager
  extends ApplicationService
  implements DesktopManagerInterface, DesktopClientRequiresWebMethods
{
  updateObservers: {
    callback: (component: ComponentItem) => void
  }[] = []

  dataLoaded = false
  lastSearchedText?: string

  private textBackupsInterval: ReturnType<typeof setInterval> | undefined
  private needsInitialTextBackup = false

  constructor(
    application: WebApplicationInterface,
    private device: DesktopDeviceInterface,
    private backups: BackupServiceInterface,
  ) {
    super(application, new InternalEventBus())

    const markdownConverter = new HeadlessSuperConverter()
    backups.setSuperConverter(markdownConverter)
  }

  async handleWatchedDirectoriesChanges(changes: DesktopWatchedDirectoriesChanges): Promise<void> {
    void this.backups.importWatchedDirectoryChanges(changes)
  }

  async handleHomeServerStarted(_serverUrl: string): Promise<void> {}

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
      if (this.backups.isTextBackupsEnabled()) {
        this.beginTextBackupsTimer()
      }
    } else if (eventName === ApplicationEvent.MajorDataChange) {
      void this.saveDesktopBackup()
    }
  }

  async saveDesktopBackup(): Promise<void> {
    this.webApplication.notifyWebEvent(WebAppEvent.BeganBackupDownload)

    const data = await this.getBackupFile()
    if (data) {
      await this.webApplication.fileBackups?.saveTextBackupData(data)
      this.webApplication.notifyWebEvent(WebAppEvent.EndedBackupDownload, { success: true })
    }
  }

  private async getBackupFile(): Promise<string | undefined> {
    const encrypted = this.application.hasProtectionSources()
    const result = encrypted
      ? await this.application.createEncryptedBackupFile.execute({ skipAuthorization: true })
      : await this.application.createDecryptedBackupFile.execute()

    if (result.isFailed()) {
      return undefined
    }

    return JSON.stringify(result.getValue(), null, 2)
  }

  getExtServerHost(): string {
    assert(this.device.extensionsServerHost)

    return this.device.extensionsServerHost
  }

  /**
   * Sending a component in its raw state is really slow for the desktop app
   * Keys are not passed into ItemParams, so the result is not encrypted
   */
  convertComponentForTransmission(component: ComponentInterface) {
    return component.payloadRepresentation().ejected()
  }

  syncComponentsInstallation(components: ComponentInterface[]) {
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

  registerUpdateObserver(callback: (component: ComponentInterface) => void): () => void {
    const observer = {
      callback: callback,
    }
    this.updateObservers.push(observer)
    return () => {
      removeFromArray(this.updateObservers, observer)
    }
  }

  searchText(text?: string): void {
    this.lastSearchedText = text
    this.device.onSearch(text)
  }

  redoSearch(): void {
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

  consoleLog(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message)
  }

  async onComponentInstallationComplete(componentData: DecryptedTransferPayload<ComponentContent>) {
    const component = this.application.items.findItem(componentData.uuid)
    if (!component) {
      return
    }

    const updatedComponent = (
      await this.application.changeAndSaveItem.execute(
        component,
        (m) => {
          const mutator = m as ComponentMutator
          mutator.local_url = componentData.content.local_url as string
          mutator.package_info = componentData.content.package_info
          mutator.setAppDataItem(AppDataField.ComponentInstallError, undefined)
        },
        undefined,
        PayloadEmitSource.DesktopComponentSync,
      )
    ).getValue()

    for (const observer of this.updateObservers) {
      observer.callback(updatedComponent as ComponentItem)
    }
  }
}
