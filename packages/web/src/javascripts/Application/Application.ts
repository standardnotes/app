import { WebCrypto } from '@/Application/Crypto'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
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
  WebAppEvent,
  WebApplicationInterface,
  MobileDeviceInterface,
  MobileUnlockTiming,
} from '@standardnotes/snjs'
import { makeObservable, observable } from 'mobx'
import { PanelResizedData } from '@/Types/PanelResizedData'
import { isDesktopApplication } from '@/Utils'
import { DesktopManager } from './Device/DesktopManager'
import { ArchiveManager, AutolockService, IOService, WebAlertService, ThemeManager } from '@standardnotes/ui-services'
import { MobileWebReceiver } from './MobileWebReceiver'
import { AndroidBackHandler } from '@/NativeMobileWeb/AndroidBackHandler'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { setViewportHeightWithFallback } from '@/App'

type WebServices = {
  viewControllerManager: ViewControllerManager
  desktopService?: DesktopManager
  autolockService?: AutolockService
  archiveService: ArchiveManager
  themeService: ThemeManager
  io: IOService
}

export type WebEventObserver = (event: WebAppEvent, data?: unknown) => void

export class WebApplication extends SNApplication implements WebApplicationInterface {
  private webServices!: WebServices
  private webEventObservers: WebEventObserver[] = []
  public itemControllerGroup: ItemGroupController
  public iconsController: IconsController
  private onVisibilityChange: () => void
  private mobileWebReceiver?: MobileWebReceiver
  private androidBackHandler?: AndroidBackHandler

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

    if (this.isNativeMobileWeb()) {
      this.mobileWebReceiver = new MobileWebReceiver(this)
      this.androidBackHandler = new AndroidBackHandler()

      // eslint-disable-next-line no-console
      console.log = (...args) => {
        this.mobileDevice().consoleLog(...args)
      }
    }

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
      ;(this.mobileWebReceiver as unknown) = undefined

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

  mobileDevice(): MobileDeviceInterface {
    if (!this.isNativeMobileWeb()) {
      throw Error('Attempting to access device as mobile device on non mobile platform')
    }
    return this.deviceInterface as MobileDeviceInterface
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
    return this.getPreference(PrefKey.EditorSpellcheck, PrefDefaults[PrefKey.EditorSpellcheck])
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

  async handleMobileEnteringBackgroundEvent(): Promise<void> {
    await this.lockApplicationAfterMobileEventIfApplicable()
  }

  async handleMobileGainingFocusEvent(): Promise<void> {
    setViewportHeightWithFallback()
  }

  async handleMobileLosingFocusEvent(): Promise<void> {
    if (this.protections.getMobileScreenshotPrivacyEnabled()) {
      this.mobileDevice().stopHidingMobileInterfaceFromScreenshots()
    }

    await this.lockApplicationAfterMobileEventIfApplicable()
  }

  async handleMobileResumingFromBackgroundEvent(): Promise<void> {
    if (this.protections.getMobileScreenshotPrivacyEnabled()) {
      this.mobileDevice().hideMobileInterfaceFromScreenshots()
    }

    setViewportHeightWithFallback()
  }

  private async lockApplicationAfterMobileEventIfApplicable(): Promise<void> {
    const isLocked = await this.isLocked()
    if (isLocked) {
      return
    }

    const hasBiometrics = this.protections.hasBiometricsEnabled()
    const hasPasscode = this.hasPasscode()
    const passcodeTiming = this.protections.getMobilePasscodeTiming()
    const biometricsTiming = this.protections.getMobileBiometricsTiming()

    const passcodeLockImmediately = hasPasscode && passcodeTiming === MobileUnlockTiming.Immediately
    const biometricsLockImmediately = hasBiometrics && biometricsTiming === MobileUnlockTiming.Immediately

    if (passcodeLockImmediately || biometricsLockImmediately) {
      await this.lock()
    }
  }

  handleAndroidBackButtonPressed(): void {
    if (typeof this.androidBackHandler !== 'undefined') {
      this.androidBackHandler.notifyEvent()
    }
  }

  addAndroidBackHandlerEventListener(listener: () => boolean) {
    if (typeof this.androidBackHandler !== 'undefined') {
      return this.androidBackHandler.addEventListener(listener)
    }
    return
  }
}
