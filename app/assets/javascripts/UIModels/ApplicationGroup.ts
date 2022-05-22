import { WebApplication } from './Application'
import {
  ApplicationDescriptor,
  SNApplicationGroup,
  Platform,
  InternalEventBus,
  isDesktopDevice,
} from '@standardnotes/snjs'
import { AppState } from '@/UIModels/AppState'
import { getPlatform, isDesktopApplication } from '@/Utils'
import { ArchiveManager } from '@/Services/ArchiveManager'
import { DesktopManager } from '@/Services/DesktopManager'
import { IOService } from '@/Services/IOService'
import { AutolockService } from '@/Services/AutolockService'
import { ThemeManager } from '@/Services/ThemeManager'
import { WebOrDesktopDevice } from '@/Device/WebOrDesktopDevice'

const createApplication = (
  descriptor: ApplicationDescriptor,
  deviceInterface: WebOrDesktopDevice,
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  webSocketUrl: string,
) => {
  const platform = getPlatform()

  const application = new WebApplication(
    deviceInterface,
    platform,
    descriptor.identifier,
    defaultSyncServerHost,
    webSocketUrl,
  )

  const appState = new AppState(application, device)
  const archiveService = new ArchiveManager(application)
  const io = new IOService(platform === Platform.MacWeb || platform === Platform.MacDesktop)
  const autolockService = new AutolockService(application, new InternalEventBus())
  const themeService = new ThemeManager(application)

  application.setWebServices({
    appState,
    archiveService,
    desktopService: isDesktopDevice(device) ? new DesktopManager(application, device) : undefined,
    io,
    autolockService,
    themeService,
  })

  return application
}

export class ApplicationGroup extends SNApplicationGroup<WebOrDesktopDevice> {
  constructor(private defaultSyncServerHost: string, device: WebOrDesktopDevice, private webSocketUrl: string) {
    super(device)
  }

  override async initialize(): Promise<void> {
    const defaultSyncServerHost = this.defaultSyncServerHost
    const webSocketUrl = this.webSocketUrl

    await super.initialize({
      applicationCreator: async (descriptor, device) => {
        return createApplication(descriptor, device, defaultSyncServerHost, device, webSocketUrl)
      },
    })

    if (isDesktopApplication()) {
      window.webClient = (this.primaryApplication as WebApplication).getDesktopService()
    }
  }

  override deinit() {
    super.deinit()

    if (isDesktopApplication()) {
      delete window.webClient
    }
  }
}
