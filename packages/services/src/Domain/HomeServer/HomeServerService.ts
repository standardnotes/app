import { Environment } from '@standardnotes/models'
import { FileBackupsDevice } from '@standardnotes/files'

import { ApplicationStage } from '../Application/ApplicationStage'
import { DesktopDeviceInterface } from '../Device/DesktopDeviceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { StorageKey } from '../Storage/StorageKeys'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'

import { HomeServerServiceInterface } from './HomeServerServiceInterface'
import { HomeServerEnvironmentConfiguration } from './HomeServerEnvironmentConfiguration'

export class HomeServerService extends AbstractService implements HomeServerServiceInterface {
  private readonly HOME_SERVER_DATA_DIRECTORY_NAME = 'Standard Notes Homer Server'

  constructor(
    private desktopDevice: DesktopDeviceInterface,
    private fileBackupsDevice: FileBackupsDevice,
    private storageService: StorageServiceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  getLastServerErrorMessage(): string | undefined {
    return this.desktopDevice.getLastServerErrorMessage()
  }

  async restartHomeServer(): Promise<void> {
    await this.desktopDevice.stopServer()
    await this.desktopDevice.startServer()
  }

  async setHomeServerConfiguration(config: HomeServerEnvironmentConfiguration): Promise<void> {
    this.storageService.setValue(StorageKey.HomeServerEnvironmentConfiguration, JSON.stringify(config))

    await this.setHomeServerConfigurationOnTheDevice()
  }

  override deinit() {
    ;(this.desktopDevice as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    super.deinit()
  }

  async enableHomeServer(): Promise<void> {
    this.storageService.setValue(StorageKey.HomeServerEnabled, true)

    await this.desktopDevice.startServer()
  }

  isHomeServerEnabled(): boolean {
    return this.storageService.getValue(StorageKey.HomeServerEnabled, undefined, false)
  }

  getHomeServerDataLocation(): string | undefined {
    return this.storageService.getValue(StorageKey.HomeServerDataLocation)
  }

  async disableHomeServer(): Promise<void> {
    this.storageService.setValue(StorageKey.HomeServerEnabled, false)

    await this.desktopDevice.stopServer()
  }

  getHomeServerConfiguration(): HomeServerEnvironmentConfiguration | undefined {
    const config = this.storageService.getValue(StorageKey.HomeServerEnvironmentConfiguration)
    if (!config) {
      return undefined
    }

    return JSON.parse(config as string) as HomeServerEnvironmentConfiguration
  }

  async changeHomeServerDataLocation(): Promise<string | undefined> {
    const oldLocation = this.getHomeServerDataLocation()
    const newLocation = await this.fileBackupsDevice.presentDirectoryPickerForLocationChangeAndTransferOld(
      '',
      oldLocation,
    )

    if (!newLocation) {
      return undefined
    }

    this.storageService.setValue(StorageKey.HomeServerDataLocation, newLocation)

    return newLocation
  }

  async openHomeServerDataLocation(): Promise<void> {
    const location = this.getHomeServerDataLocation()
    if (location) {
      void this.fileBackupsDevice.openLocation(location)
    }
  }

  override async handleApplicationStage(stage: ApplicationStage) {
    await super.handleApplicationStage(stage)

    switch (stage) {
      case ApplicationStage.StorageDecrypted_09: {
        void this.setHomeServerConfigurationOnTheDevice()
        break
      }
      case ApplicationStage.Launched_10: {
        void this.automaticallyEnableTextBackupsIfPreferenceNotSet()
        void this.setHomeServerDataLocationOnDevice()
        await this.startHomeServerIfItIsEnabled()
        break
      }
    }
  }

  private async startHomeServerIfItIsEnabled(): Promise<void> {
    const homeServerIsEnabled = this.storageService.getValue(StorageKey.HomeServerEnabled, undefined, false)
    if (homeServerIsEnabled) {
      await this.desktopDevice.startServer()
    }
  }

  private async automaticallyEnableTextBackupsIfPreferenceNotSet(): Promise<void> {
    if (this.storageService.getValue(StorageKey.HomeServerDataLocation) === undefined) {
      const location = `${await this.desktopDevice.getUserDocumentsDirectory()}/${this.HOME_SERVER_DATA_DIRECTORY_NAME}`

      this.storageService.setValue(StorageKey.HomeServerDataLocation, location)
    }
  }

  private async setHomeServerConfigurationOnTheDevice(): Promise<void> {
    const isDesktopEnvironment = this.desktopDevice.environment === Environment.Desktop
    if (!isDesktopEnvironment) {
      return
    }

    const homeServerConfiguration = this.storageService.getValue(StorageKey.HomeServerEnvironmentConfiguration) as
      | string
      | undefined

    if (homeServerConfiguration !== undefined) {
      await this.desktopDevice.setHomeServerConfiguration(homeServerConfiguration)
    }
  }

  private async setHomeServerDataLocationOnDevice(): Promise<void> {
    await this.desktopDevice.setHomeServerDataLocation(this.storageService.getValue(StorageKey.HomeServerDataLocation))
  }
}
