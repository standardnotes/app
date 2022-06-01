import { WebCrypto } from '@/Application/Crypto'
import { WebAlertService } from '@/Services/AlertService'
import { ArchiveManager } from '@/Services/ArchiveManager'
import { AutolockService } from '@/Services/AutolockService'
import { DesktopManager } from '@/Services/DesktopManager'
import { IOService } from '@/Services/IOService'
import { ThemeManager } from '@/Services/ThemeManager'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { WebOrDesktopDevice } from '@/Application/Device/WebOrDesktopDevice'
import {
  DeinitSource,
  Platform,
  SNApplication,
  NoteGroupController,
  removeFromArray,
  IconsController,
  DesktopDeviceInterface,
  isDesktopDevice,
  DeinitMode,
} from '@standardnotes/snjs'
import { makeObservable, observable } from 'mobx'

type WebServices = {
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  io: IOService
}

export enum WebAppEvent {
  NewUpdateAvailable = 'NewUpdateAvailable',
  DesktopWindowGainedFocus = 'DesktopWindowGainedFocus',
  DesktopWindowLostFocus = 'DesktopWindowLostFocus',
}

export type WebEventObserver = (event: WebAppEvent) => void

export class WebApplication extends SNApplication {
  private webServices!: WebServices
  private webEventObservers: WebEventObserver[] = []
  public noteControllerGroup: NoteGroupController
  public iconsController: IconsController

  constructor(
    deviceInterface: WebOrDesktopDevice,
    platform: Platform,
    identifier: string,
    defaultSyncServerHost: string,
    webSocketUrl: string,
  ) {
    super({
      environment: deviceInterface.environment,
      platform: platform,
      deviceInterface: deviceInterface,
      crypto: WebCrypto,
      alertService: new WebAlertService(),
      identifier,
      defaultHost: defaultSyncServerHost,
      appVersion: deviceInterface.appVersion,
      webSocketUrl: webSocketUrl,
      supportsFileNavigation: window.enabledUnfinishedFeatures || false,
    })

    makeObservable(this, {
      dealloced: observable,
    })

    deviceInterface.setApplication(this)
    this.noteControllerGroup = new NoteGroupController(this)
    this.iconsController = new IconsController()
  }

  override deinit(mode: DeinitMode, source: DeinitSource): void {
    super.deinit(mode, source)

    try {
      for (const service of Object.values(this.webServices)) {
        if (!service) {
          continue
        }

        if ('deinit' in service) {
          service.deinit?.(source)
        }

        ;(service as { application?: WebApplication }).application = undefined
      }

      this.webServices = {} as WebServices

      this.noteControllerGroup.deinit()
      ;(this.noteControllerGroup as unknown) = undefined

      this.webEventObservers.length = 0
    } catch (error) {
      console.error('Error while deiniting application', error)
    }
  }

  setWebServices(services: WebServices): void {
    this.webServices = services
  }

  public addWebEventObserver(observer: WebEventObserver): () => void {
    this.webEventObservers.push(observer)
    return () => {
      removeFromArray(this.webEventObservers, observer)
    }
  }

  public notifyWebEvent(event: WebAppEvent): void {
    for (const observer of this.webEventObservers) {
      observer(event)
    }
  }

  public getViewControllerManager(): ViewControllerManager {
    return this.webServices.viewControllerManager
  }

  public getDesktopService(): DesktopManager | undefined {
    return this.webServices.desktopService
  }

  public getAutolockService() {
    return this.webServices.autolockService
  }

  public getArchiveService() {
    return this.webServices.archiveService
  }

  public get desktopDevice(): DesktopDeviceInterface | undefined {
    if (isDesktopDevice(this.deviceInterface)) {
      return this.deviceInterface
    }

    return undefined
  }

  public getThemeService() {
    return this.webServices.themeService
  }

  public get io() {
    return this.webServices.io
  }

  async checkForSecurityUpdate() {
    return this.protocolUpgradeAvailable()
  }

  downloadBackup(): void | Promise<void> {
    if (isDesktopDevice(this.deviceInterface)) {
      return this.deviceInterface.downloadBackup()
    }
  }

  async signOutAndDeleteLocalBackups(): Promise<void> {
    isDesktopDevice(this.deviceInterface) && (await this.deviceInterface.deleteLocalBackups())

    return this.user.signOut()
  }
}
