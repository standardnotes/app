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
  ItemGroupController,
  removeFromArray,
  IconsController,
  DesktopDeviceInterface,
  isDesktopDevice,
  DeinitMode,
  PrefKey,
  SNTag,
  ContentType,
  DecryptedItemInterface,
} from '@standardnotes/snjs'
import { makeObservable, observable } from 'mobx'
import { PanelResizedData } from '@/Types/PanelResizedData'
import { WebAppEvent } from './WebAppEvent'
import { isDesktopApplication } from '@/Utils'

type WebServices = {
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  io: IOService
}

export type WebEventObserver = (event: WebAppEvent, data?: unknown) => void

export class WebApplication extends SNApplication {
  private webServices!: WebServices
  private webEventObservers: WebEventObserver[] = []
  public itemControllerGroup: ItemGroupController
  public iconsController: IconsController
  private onVisibilityChange: () => void

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
      supportsFileNavigation: true,
    })

    makeObservable(this, {
      dealloced: observable,
    })

    deviceInterface.setApplication(this)
    this.itemControllerGroup = new ItemGroupController(this)
    this.iconsController = new IconsController()

    this.onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      const event = visible ? WebAppEvent.WindowDidFocus : WebAppEvent.WindowDidBlur
      this.notifyWebEvent(event)
    }

    if (!isDesktopApplication()) {
      document.addEventListener('visibilitychange', this.onVisibilityChange)
    }
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

      this.itemControllerGroup.deinit()
      ;(this.itemControllerGroup as unknown) = undefined

      this.webEventObservers.length = 0

      document.removeEventListener('visibilitychange', this.onVisibilityChange)
      ;(this.onVisibilityChange as unknown) = undefined
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

  public notifyWebEvent(event: WebAppEvent, data?: unknown): void {
    for (const observer of this.webEventObservers) {
      observer(event, data)
    }
  }

  publishPanelDidResizeEvent(name: string, collapsed: boolean) {
    const data: PanelResizedData = {
      panel: name,
      collapsed: collapsed,
    }
    this.notifyWebEvent(WebAppEvent.PanelResized, data)
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

  isGlobalSpellcheckEnabled(): boolean {
    return this.getPreference(PrefKey.EditorSpellcheck, true)
  }

  public getItemTags(item: DecryptedItemInterface) {
    return this.items.itemsReferencingItem(item).filter((ref) => {
      return ref.content_type === ContentType.Tag
    }) as SNTag[]
  }

  public get version(): string {
    return (this.deviceInterface as WebOrDesktopDevice).appVersion
  }

  async toggleGlobalSpellcheck() {
    const currentValue = this.isGlobalSpellcheckEnabled()
    return this.setPreference(PrefKey.EditorSpellcheck, !currentValue)
  }
}
