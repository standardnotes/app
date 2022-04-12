import { WebDeviceInterface } from '@/WebDeviceInterface'
import { WebApplication } from './Application'
import {
  ApplicationDescriptor,
  SNApplicationGroup,
  DeviceInterface,
  Platform,
  Runtime,
  InternalEventBus,
} from '@standardnotes/snjs'
import { AppState } from '@/UIModels/AppState'
import { Bridge } from '@/Services/Bridge'
import { getPlatform, isDesktopApplication } from '@/Utils'
import { ArchiveManager } from '@/Services/ArchiveManager'
import { DesktopManager } from '@/Services/DesktopManager'
import { IOService } from '@/Services/IOService'
import { AutolockService } from '@/Services/AutolockService'
import { StatusManager } from '@/Services/StatusManager'
import { ThemeManager } from '@/Services/ThemeManager'

export class ApplicationGroup extends SNApplicationGroup {
  constructor(
    private defaultSyncServerHost: string,
    private bridge: Bridge,
    private runtime: Runtime,
    private webSocketUrl: string,
  ) {
    super(new WebDeviceInterface(bridge))
  }

  override async initialize(): Promise<void> {
    await super.initialize({
      applicationCreator: this.createApplication,
    })

    if (isDesktopApplication()) {
      Object.defineProperty(window, 'desktopManager', {
        get: () => (this.primaryApplication as WebApplication).getDesktopService(),
      })
    }
  }

  private createApplication = (
    descriptor: ApplicationDescriptor,
    deviceInterface: DeviceInterface,
  ) => {
    const platform = getPlatform()
    const application = new WebApplication(
      deviceInterface as WebDeviceInterface,
      platform,
      descriptor.identifier,
      this.defaultSyncServerHost,
      this.bridge,
      this.webSocketUrl,
      this.runtime,
    )
    const appState = new AppState(application, this.bridge)
    const archiveService = new ArchiveManager(application)
    const desktopService = new DesktopManager(application, this.bridge)
    const io = new IOService(platform === Platform.MacWeb || platform === Platform.MacDesktop)
    const autolockService = new AutolockService(application, new InternalEventBus())
    const statusManager = new StatusManager()
    const themeService = new ThemeManager(application)
    application.setWebServices({
      appState,
      archiveService,
      desktopService,
      io,
      autolockService,
      statusManager,
      themeService,
    })
    return application
  }
}
