import { WebApplication } from './WebApplication'
import { ApplicationDescriptor, SNApplicationGroup } from '@standardnotes/snjs'
import { getPlatform, isDesktopApplication } from '@/Utils'
import { WebOrDesktopDevice } from '@/Application/Device/WebOrDesktopDevice'

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

  return application
}

export class WebApplicationGroup extends SNApplicationGroup<WebOrDesktopDevice> {
  constructor(
    private defaultSyncServerHost: string,
    device: WebOrDesktopDevice,
    private webSocketUrl: string,
  ) {
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
      window.webClient = (this.primaryApplication as WebApplication).desktopManager
    }
  }

  override deinit() {
    super.deinit()

    if (isDesktopApplication()) {
      delete window.webClient
    }
  }
}
