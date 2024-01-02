import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { ApplicationStageChangedEventPayload } from './../Event/ApplicationStageChangedEventPayload'
import { ApplicationEvent } from './../Event/ApplicationEvent'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { Result } from '@standardnotes/domain-core'

import { ApplicationStage } from '../Application/ApplicationStage'
import { DesktopDeviceInterface } from '../Device/DesktopDeviceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { AbstractService } from '../Service/AbstractService'
import { RawStorageKey } from '../Storage/StorageKeys'

import { HomeServerServiceInterface } from './HomeServerServiceInterface'
import { HomeServerEnvironmentConfiguration } from './HomeServerEnvironmentConfiguration'
import { HomeServerStatus } from './HomeServerStatus'
import { Platform } from '@standardnotes/models'

export class HomeServerService
  extends AbstractService
  implements HomeServerServiceInterface, InternalEventHandlerInterface
{
  private readonly HOME_SERVER_DATA_DIRECTORY_NAME = '.homeserver'

  constructor(
    private desktopDevice: DesktopDeviceInterface,
    private platform: Platform,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage

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
  }

  override deinit() {
    ;(this.desktopDevice as unknown) = undefined
    super.deinit()
  }

  async getHomeServerStatus(): Promise<HomeServerStatus> {
    const isHomeServerRunning = await this.desktopDevice.isHomeServerRunning()

    if (!isHomeServerRunning) {
      return { status: 'off', errorMessage: await this.desktopDevice.getHomeServerLastErrorMessage() }
    }

    return {
      status: 'on',
      url: await this.getHomeServerUrl(),
    }
  }

  async getHomeServerLogs(): Promise<string[]> {
    return this.desktopDevice.getHomeServerLogs()
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

  async activatePremiumFeatures(username: string, subscriptionId: number): Promise<Result<string>> {
    const result = await this.desktopDevice.activatePremiumFeatures(username, subscriptionId)

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
    await this.desktopDevice.setRawStorageValue(RawStorageKey.HomeServerEnabled, 'true')

    await this.startHomeServer()
  }

  async isHomeServerEnabled(): Promise<boolean> {
    const value = await this.desktopDevice.getRawStorageValue(RawStorageKey.HomeServerEnabled)

    return value === 'true'
  }

  async getHomeServerDataLocation(): Promise<string | undefined> {
    return this.desktopDevice.getRawStorageValue(RawStorageKey.HomeServerDataLocation)
  }

  async disableHomeServer(): Promise<Result<string>> {
    await this.desktopDevice.setRawStorageValue(RawStorageKey.HomeServerEnabled, 'false')

    const result = await this.stopHomeServer()
    if (result !== undefined) {
      return Result.fail(result)
    }

    return Result.ok('Home server disabled')
  }

  async changeHomeServerDataLocation(): Promise<Result<string>> {
    const oldLocation = await this.getHomeServerDataLocation()
    const newLocation = await this.desktopDevice.presentDirectoryPickerForLocationChangeAndTransferOld(
      this.HOME_SERVER_DATA_DIRECTORY_NAME,
      oldLocation,
    )

    if (!newLocation) {
      const lastErrorMessage = await this.desktopDevice.getDirectoryManagerLastErrorMessage()

      return Result.fail(lastErrorMessage ?? 'No location selected')
    }

    await this.desktopDevice.setRawStorageValue(RawStorageKey.HomeServerDataLocation, newLocation)

    await this.desktopDevice.setHomeServerDataLocation(newLocation)

    return Result.ok(newLocation)
  }

  async openHomeServerDataLocation(): Promise<void> {
    const location = await this.getHomeServerDataLocation()
    if (location) {
      void this.desktopDevice.openLocation(location)
    }
  }

  private async startHomeServerIfItIsEnabled(): Promise<void> {
    const homeServerIsEnabled = await this.isHomeServerEnabled()
    if (homeServerIsEnabled) {
      await this.startHomeServer()
    }
  }

  private async setHomeServerDataLocationOnDevice(): Promise<void> {
    let location = await this.getHomeServerDataLocation()
    if (!location) {
      const documentsDirectory = await this.desktopDevice.getUserDocumentsDirectory()
      if (!documentsDirectory) {
        return
      }
      const separator = this.platform === Platform.WindowsDesktop ? '\\' : '/'
      location = `${documentsDirectory}${separator}${this.HOME_SERVER_DATA_DIRECTORY_NAME}`
    }

    await this.desktopDevice.setRawStorageValue(RawStorageKey.HomeServerDataLocation, location)

    await this.desktopDevice.setHomeServerDataLocation(location)
  }
}
