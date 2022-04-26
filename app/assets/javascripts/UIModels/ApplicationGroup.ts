import { WebApplication } from './Application'
import { ApplicationDescriptor, SNApplicationGroup, Platform, Runtime, InternalEventBus } from '@standardnotes/snjs'
import { AppState } from '@/UIModels/AppState'
import { getPlatform, isDesktopApplication } from '@/Utils'
import { ArchiveManager } from '@/Services/ArchiveManager'
import { DesktopManager } from '@/Services/DesktopManager'
import { IOService } from '@/Services/IOService'
import { AutolockService } from '@/Services/AutolockService'
import { StatusManager } from '@/Services/StatusManager'
import { ThemeManager } from '@/Services/ThemeManager'
import { WebOrDesktopDevice } from '@/Device/WebOrDesktopDevice'
import { isDesktopDevice } from '@/Device/DesktopDeviceInterface'

export class ApplicationGroup extends SNApplicationGroup<WebOrDesktopDevice> {
  constructor(
    private defaultSyncServerHost: string,
    private device: WebOrDesktopDevice,
    private runtime: Runtime,
    private webSocketUrl: string,
  ) {
    super(device)
  }

  override async initialize(): Promise<void> {
    await super.initialize({
      applicationCreator: this.createApplication,
    })

    if (isDesktopApplication()) {
      Object.defineProperty(window, 'webClient', {
        get: () => (this.primaryApplication as WebApplication).getDesktopService(),
      })
    }
  }

  override handleAllWorkspacesSignedOut(): void {
    isDesktopDevice(this.deviceInterface) && this.deviceInterface.destroyAllData()
  }

  private createApplication = (descriptor: ApplicationDescriptor, deviceInterface: WebOrDesktopDevice) => {
    const platform = getPlatform()

    const application = new WebApplication(
      deviceInterface,
      platform,
      descriptor.identifier,
      this.defaultSyncServerHost,
      this.webSocketUrl,
      this.runtime,
    )

    const appState = new AppState(application, this.device)
    const archiveService = new ArchiveManager(application)
    const io = new IOService(platform === Platform.MacWeb || platform === Platform.MacDesktop)
    const autolockService = new AutolockService(application, new InternalEventBus())
    const statusManager = new StatusManager()
    const themeService = new ThemeManager(application)

    application.setWebServices({
      appState,
      archiveService,
      desktopService: isDesktopDevice(this.device) ? new DesktopManager(application, this.device) : undefined,
      io,
      autolockService,
      statusManager,
      themeService,
    })

    return application
  }
}
