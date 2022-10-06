import { WebApplication } from './Application'
import {
  ApplicationDescriptor,
  SNApplicationGroup,
  Platform,
  InternalEventBus,
  isDesktopDevice,
} from '@standardnotes/snjs'
import { ArchiveManager, IOService, AutolockService, ThemeManager } from '@standardnotes/ui-services'

import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { getPlatform, isDesktopApplication } from '@/Utils'
import { WebOrDesktopDevice } from '@/Application/Device/WebOrDesktopDevice'
import { DesktopManager } from './Device/DesktopManager'

const createApplication = (
  descriptor: ApplicationDescriptor,
  deviceInterface: WebOrDesktopDevice,
  defaultSyncServerHost: string,
  device: WebOrDesktopDevice,
  webSocketUrl: string,
) => {
  const platform = getPlatform(device)

  const application = new WebApplication(
    deviceInterface,
    platform,
    descriptor.identifier,
    defaultSyncServerHost,
    webSocketUrl,
  )

  const viewControllerManager = new ViewControllerManager(application, device)
  const archiveService = new ArchiveManager(application)
  const io = new IOService(platform === Platform.MacWeb || platform === Platform.MacDesktop)
  const internalEventBus = new InternalEventBus()
  const themeService = new ThemeManager(application, internalEventBus)

  application.setWebServices({
    viewControllerManager,
    archiveService,
    desktopService: isDesktopDevice(device) ? new DesktopManager(application, device) : undefined,
    io,
    autolockService: application.isNativeMobileWeb() ? undefined : new AutolockService(application, internalEventBus),
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
