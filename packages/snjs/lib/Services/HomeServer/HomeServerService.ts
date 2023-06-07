import * as Services from '@standardnotes/services'
import { Environment } from '@standardnotes/models'

export class HomeServerService extends Services.AbstractService {
  constructor(
    private deviceInterface: Services.DeviceInterface,
    private storageService: Services.StorageServiceInterface,
    protected override internalEventBus: Services.InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public override deinit() {
    ;(this.deviceInterface as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    super.deinit()
  }

  override async handleApplicationStage(stage: Services.ApplicationStage) {
    await super.handleApplicationStage(stage)

    switch (stage) {
      case Services.ApplicationStage.StorageDecrypted_09: {
        const isDesktopEnvironment = this.deviceInterface.environment === Environment.Desktop
        if (isDesktopEnvironment) {
          const homeServerConfiguration = this.storageService.getValue(
            Services.StorageKey.HomeServerEnvironmentConfiguration,
          ) as string | undefined

          if (homeServerConfiguration !== undefined) {
            await (this.deviceInterface as Services.DesktopDeviceInterface).setHomeServerConfiguration(
              homeServerConfiguration,
            )
          }
        }
        break
      }
    }
  }
}
