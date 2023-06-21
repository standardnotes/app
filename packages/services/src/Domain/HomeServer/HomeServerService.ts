import { FileBackupsDevice } from '@standardnotes/files'

import { ApplicationStage } from '../Application/ApplicationStage'
import { DesktopDeviceInterface } from '../Device/DesktopDeviceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { StorageKey } from '../Storage/StorageKeys'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'

import { HomeServerServiceInterface } from './HomeServerServiceInterface'
import { HomeServerEnvironmentConfiguration } from './HomeServerEnvironmentConfiguration'
import { Result } from '@standardnotes/domain-core'

export class HomeServerService extends AbstractService implements HomeServerServiceInterface {
  private readonly HOME_SERVER_DATA_DIRECTORY_NAME = '.homeserver'

  constructor(
    private desktopDevice: DesktopDeviceInterface,
    private fileBackupsDevice: FileBackupsDevice,
    private storageService: StorageServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  override deinit() {
    ;(this.desktopDevice as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    super.deinit()
  }

  override async handleApplicationStage(stage: ApplicationStage) {
    await super.handleApplicationStage(stage)

    switch (stage) {
      case ApplicationStage.StorageDecrypted_09: {
        await this.setHomeServerDataLocationOnDevice()
        break
      }
      case ApplicationStage.Launched_10: {
        await this.startHomeServerIfItIsEnabled()
        break
      }
    }
  }

  async getHomeServerUrl(): Promise<string | undefined> {
    return this.desktopDevice.getHomeServerUrl()
  }

  async startHomeServer(): Promise<string | undefined> {
    return this.desktopDevice.startHomeServer()
  }

  async stopHomeServer(): Promise<string | undefined> {
    return this.desktopDevice.stopHomeServer()
  }

  async isHomeServerRunning(): Promise<boolean> {
    return this.desktopDevice.isHomeServerRunning()
  }

  async activatePremiumFeatures(username: string): Promise<Result<string>> {
    const result = await this.desktopDevice.activatePremiumFeatures(username)

    if (result !== undefined) {
      return Result.fail(result)
    }

    return Result.ok('Premium features activated')
  }

  async setHomeServerConfiguration(config: HomeServerEnvironmentConfiguration): Promise<void> {
    await this.desktopDevice.setHomeServerConfiguration(JSON.stringify(config))
  }

  async getHomeServerConfiguration(): Promise<HomeServerEnvironmentConfiguration | undefined> {
    const configurationJSONString = await this.desktopDevice.getHomeServerConfiguration()
    if (!configurationJSONString) {
      return undefined
    }

    return JSON.parse(configurationJSONString) as HomeServerEnvironmentConfiguration
  }

  async enableHomeServer(): Promise<void> {
    this.storageService.setValue(StorageKey.HomeServerEnabled, true)

    await this.startHomeServer()
  }

  isHomeServerEnabled(): boolean {
    return this.storageService.getValue(StorageKey.HomeServerEnabled, undefined, false)
  }

  getHomeServerDataLocation(): string | undefined {
    return this.storageService.getValue(StorageKey.HomeServerDataLocation)
  }

  async disableHomeServer(): Promise<Result<string>> {
    this.storageService.setValue(StorageKey.HomeServerEnabled, false)

    const result = await this.stopHomeServer()
    if (result !== undefined) {
      return Result.fail(result)
    }

    return Result.ok('Home server disabled')
  }

  async changeHomeServerDataLocation(): Promise<Result<string>> {
    const oldLocation = this.getHomeServerDataLocation()
    const newLocation = await this.fileBackupsDevice.presentDirectoryPickerForLocationChangeAndTransferOld(
      this.HOME_SERVER_DATA_DIRECTORY_NAME,
      oldLocation,
    )

    if (!newLocation) {
      const lastErrorMessage = await this.fileBackupsDevice.getLastErrorMessage()

      return Result.fail(lastErrorMessage ?? 'No location selected')
    }

    this.storageService.setValue(StorageKey.HomeServerDataLocation, newLocation)

    return Result.ok(newLocation)
  }

  async openHomeServerDataLocation(): Promise<void> {
    const location = this.getHomeServerDataLocation()
    if (location) {
      void this.fileBackupsDevice.openLocation(location)
    }
  }

  private async startHomeServerIfItIsEnabled(): Promise<void> {
    const homeServerIsEnabled = this.storageService.getValue(StorageKey.HomeServerEnabled, undefined, false)
    if (homeServerIsEnabled) {
      await this.startHomeServer()
    }
  }

  private async setHomeServerDataLocationOnDevice(): Promise<void> {
    let location = this.storageService.getValue<string>(StorageKey.HomeServerDataLocation)
    if (!location) {
      const documentsDirectory = await this.desktopDevice.getUserDocumentsDirectory()
      location = `${documentsDirectory}/${this.HOME_SERVER_DATA_DIRECTORY_NAME}`
    }

    this.storageService.setValue(StorageKey.HomeServerDataLocation, location)

    await this.desktopDevice.setHomeServerDataLocation(location)
  }
}
