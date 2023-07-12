import { WebCrypto } from '@/Application/Crypto'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { WebOrDesktopDevice } from '@/Application/Device/WebOrDesktopDevice'
import {
  DeinitSource,
  Platform,
  SNApplication,
  removeFromArray,
  DesktopDeviceInterface,
  isDesktopDevice,
  DeinitMode,
  PrefKey,
  SNTag,
  ContentType,
  DecryptedItemInterface,
  WebAppEvent,
  MobileDeviceInterface,
  MobileUnlockTiming,
  DecryptedItem,
  EditorIdentifier,
  FeatureIdentifier,
  Environment,
  ApplicationOptionsDefaults,
  BackupServiceInterface,
  InternalFeatureService,
  InternalFeatureServiceInterface,
  NoteContent,
  SNNote,
} from '@standardnotes/snjs'
import { makeObservable, observable } from 'mobx'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { PanelResizedData } from '@/Types/PanelResizedData'
import { getBlobFromBase64, isAndroid, isDesktopApplication, isDev, isIOS } from '@/Utils'
import { DesktopManager } from './Device/DesktopManager'
import {
  ArchiveManager,
  AutolockService,
  ChangelogService,
  KeyboardService,
  PreferenceId,
  RouteService,
  RouteServiceInterface,
  ThemeManager,
  VaultDisplayService,
  VaultDisplayServiceInterface,
  WebAlertService,
  WebApplicationInterface,
} from '@standardnotes/ui-services'
import { MobileWebReceiver, NativeMobileEventListener } from '../NativeMobileWeb/MobileWebReceiver'
import { AndroidBackHandler } from '@/NativeMobileWeb/AndroidBackHandler'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { setCustomViewportHeight } from '@/setViewportHeightWithFallback'
import { WebServices } from './WebServices'
import { FeatureName } from '@/Controllers/FeatureName'
import { ItemGroupController } from '@/Components/NoteView/Controller/ItemGroupController'
import { VisibilityObserver } from './VisibilityObserver'
import { MomentsService } from '@/Controllers/Moments/MomentsService'
import { DevMode } from './DevMode'

export type WebEventObserver = (event: WebAppEvent, data?: unknown) => void

export class WebApplication extends SNApplication implements WebApplicationInterface {
  public readonly itemControllerGroup: ItemGroupController
  public readonly routeService: RouteServiceInterface

  private readonly webServices!: WebServices
  private readonly webEventObservers: WebEventObserver[] = []
  private readonly mobileWebReceiver?: MobileWebReceiver
  private readonly androidBackHandler?: AndroidBackHandler
  private readonly visibilityObserver?: VisibilityObserver
  private readonly mobileAppEventObserver?: () => void

  public readonly devMode?: DevMode

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
      loadBatchSize:
        deviceInterface.environment === Environment.Mobile ? 250 : ApplicationOptionsDefaults.loadBatchSize,
      sleepBetweenBatches:
        deviceInterface.environment === Environment.Mobile ? 250 : ApplicationOptionsDefaults.sleepBetweenBatches,
      allowMultipleSelection: deviceInterface.environment !== Environment.Mobile,
      allowNoteSelectionStatePersistence: deviceInterface.environment !== Environment.Mobile,
      u2fAuthenticatorRegistrationPromptFunction: startRegistration as unknown as (
        registrationOptions: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>,
      u2fAuthenticatorVerificationPromptFunction: startAuthentication as unknown as (
        authenticationOptions: Record<string, unknown>,
      ) => Promise<Record<string, unknown>>,
    })

    if (isDev) {
      this.devMode = new DevMode(this)
    }

    makeObservable(this, {
      dealloced: observable,
    })

    if (!this.isNativeMobileWeb()) {
      deviceInterface.setApplication(this)
    }

    this.itemControllerGroup = new ItemGroupController(this)
    this.routeService = new RouteService(this, this.internalEventBus)

    this.webServices = {} as WebServices
    this.webServices.keyboardService = new KeyboardService(platform, this.environment)
    this.webServices.archiveService = new ArchiveManager(this)
    this.webServices.themeService = new ThemeManager(this, this.internalEventBus)
    this.webServices.autolockService = this.isNativeMobileWeb()
      ? undefined
      : new AutolockService(this, this.internalEventBus)
    this.webServices.desktopService = isDesktopDevice(deviceInterface)
      ? new DesktopManager(this, deviceInterface, this.fileBackups as BackupServiceInterface)
      : undefined
    this.webServices.viewControllerManager = new ViewControllerManager(this, deviceInterface)
    this.webServices.changelogService = new ChangelogService(this.environment, this.storage)
    this.webServices.momentsService = new MomentsService(
      this,
      this.webServices.viewControllerManager.filesController,
      this.internalEventBus,
    )
    this.webServices.vaultDisplayService = new VaultDisplayService(this, this.internalEventBus)

    if (this.isNativeMobileWeb()) {
      this.mobileWebReceiver = new MobileWebReceiver(this)
      this.androidBackHandler = new AndroidBackHandler()
      this.mobileAppEventObserver = this.addEventObserver(async (event) => {
        this.mobileDevice().notifyApplicationEvent(event)
      })

      // eslint-disable-next-line no-console
      console.log = (...args) => {
        this.mobileDevice().consoleLog(...args)
      }
    }

    if (!isDesktopApplication()) {
      this.visibilityObserver = new VisibilityObserver((event) => {
        this.notifyWebEvent(event)
      })
    }
  }

  override deinit(mode: DeinitMode, source: DeinitSource): void {
    super.deinit(mode, source)

    if (!this.isNativeMobileWeb()) {
      this.webOrDesktopDevice().removeApplication(this)
    }

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

      ;(this.webServices as unknown) = undefined

      this.itemControllerGroup.deinit()
      ;(this.itemControllerGroup as unknown) = undefined
      ;(this.mobileWebReceiver as unknown) = undefined

      this.routeService.deinit()
      ;(this.routeService as unknown) = undefined

      this.webEventObservers.length = 0

      if (this.visibilityObserver) {
        this.visibilityObserver.deinit()
        ;(this.visibilityObserver as unknown) = undefined
      }

      if (this.mobileAppEventObserver) {
        this.mobileAppEventObserver()
        ;(this.mobileAppEventObserver as unknown) = undefined
      }
    } catch (error) {
      console.error('Error while deiniting application', error)
    }
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

    this.internalEventBus.publish({ type: event, payload: data })
  }

  publishPanelDidResizeEvent(name: string, width: number, collapsed: boolean) {
    const data: PanelResizedData = {
      panel: name,
      collapsed,
      width,
    }

    this.notifyWebEvent(WebAppEvent.PanelResized, data)
  }

  public get vaultDisplayService(): VaultDisplayServiceInterface {
    return this.webServices.vaultDisplayService
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

  public get paneController() {
    return this.webServices.viewControllerManager.paneController
  }

  public get linkingController() {
    return this.webServices.viewControllerManager.linkingController
  }

  public get changelogService() {
    return this.webServices.changelogService
  }

  public get momentsService() {
    return this.webServices.momentsService
  }

  public get featuresController() {
    return this.getViewControllerManager().featuresController
  }

  public get desktopDevice(): DesktopDeviceInterface | undefined {
    if (isDesktopDevice(this.deviceInterface)) {
      return this.deviceInterface
    }

    return undefined
  }

  public getInternalFeatureService(): InternalFeatureServiceInterface {
    return InternalFeatureService.get()
  }

  isNativeIOS() {
    return this.isNativeMobileWeb() && this.platform === Platform.Ios
  }

  get isMobileDevice() {
    return this.isNativeMobileWeb() || isIOS() || isAndroid()
  }

  get hideOutboundSubscriptionLinks() {
    return this.isNativeIOS()
  }

  mobileDevice(): MobileDeviceInterface {
    if (!this.isNativeMobileWeb()) {
      throw Error('Attempting to access device as mobile device on non mobile platform')
    }
    return this.deviceInterface as MobileDeviceInterface
  }

  webOrDesktopDevice(): WebOrDesktopDevice {
    return this.deviceInterface as WebOrDesktopDevice
  }

  public getThemeService() {
    return this.webServices.themeService
  }

  public get keyboardService() {
    return this.webServices.keyboardService
  }

  async checkForSecurityUpdate() {
    return this.protocolUpgradeAvailable()
  }

  performDesktopTextBackup(): void | Promise<void> {
    return this.getDesktopService()?.saveDesktopBackup()
  }

  isGlobalSpellcheckEnabled(): boolean {
    return this.getPreference(PrefKey.EditorSpellcheck, PrefDefaults[PrefKey.EditorSpellcheck])
  }

  public getItemTags(item: DecryptedItemInterface) {
    return this.items.itemsReferencingItem(item).filter((ref) => {
      return ref.content_type === ContentType.TYPES.Tag
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
    /** Optional override */
  }

  handleInitialMobileScreenshotPrivacy(): void {
    if (this.platform !== Platform.Android) {
      return
    }

    if (this.protections.getMobileScreenshotPrivacyEnabled()) {
      this.mobileDevice().setAndroidScreenshotPrivacy(true)
    } else {
      this.mobileDevice().setAndroidScreenshotPrivacy(false)
    }
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
  }

  handleMobileColorSchemeChangeEvent() {
    void this.getThemeService().handleMobileColorSchemeChangeEvent()
  }

  handleMobileKeyboardWillChangeFrameEvent(frame: { height: number; contentHeight: number }): void {
    if (frame.contentHeight > 0) {
      setCustomViewportHeight(frame.contentHeight, 'px', true)
    }
    this.notifyWebEvent(WebAppEvent.MobileKeyboardWillChangeFrame, frame)
  }

  handleMobileKeyboardDidChangeFrameEvent(frame: { height: number; contentHeight: number }): void {
    this.notifyWebEvent(WebAppEvent.MobileKeyboardDidChangeFrame, frame)
  }

  handleReceivedFileEvent(file: { name: string; mimeType: string; data: string }): void {
    const filesController = this.getViewControllerManager().filesController
    const blob = getBlobFromBase64(file.data, file.mimeType)
    const mappedFile = new File([blob], file.name, { type: file.mimeType })
    void filesController.uploadNewFile(mappedFile, true)
  }

  async handleReceivedTextEvent({ text, title }: { text: string; title?: string | undefined }) {
    const titleForNote = title || this.getViewControllerManager().itemListController.titleForNewNote()

    const note = this.items.createTemplateItem<NoteContent, SNNote>(ContentType.TYPES.Note, {
      title: titleForNote,
      text: text,
      references: [],
    })

    const insertedNote = await this.mutator.insertItem(note)

    this.getViewControllerManager().selectionController.selectItem(insertedNote.uuid, true).catch(console.error)
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

    if (passcodeLockImmediately) {
      await this.lock()
    } else if (biometricsLockImmediately) {
      this.softLockBiometrics()
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

  setAndroidBackHandlerFallbackListener(listener: () => boolean) {
    if (typeof this.androidBackHandler !== 'undefined') {
      this.androidBackHandler.setFallbackListener(listener)
    }
  }

  isAuthorizedToRenderItem(item: DecryptedItem): boolean {
    if (item.protected && this.hasProtectionSources()) {
      return this.hasUnprotectedAccessSession()
    }

    return true
  }

  entitledToPerTagPreferences(): boolean {
    return this.hasValidSubscription()
  }

  get entitledToFiles(): boolean {
    return this.getViewControllerManager().featuresController.entitledToFiles
  }

  showPremiumModal(featureName?: FeatureName): void {
    void this.getViewControllerManager().featuresController.showPremiumAlert(featureName)
  }

  hasValidSubscription(): boolean {
    return this.getViewControllerManager().subscriptionController.hasValidSubscription()
  }

  async openPurchaseFlow() {
    await this.getViewControllerManager().purchaseFlowController.openPurchaseFlow()
  }

  addNativeMobileEventListener = (listener: NativeMobileEventListener) => {
    if (!this.mobileWebReceiver) {
      return
    }

    return this.mobileWebReceiver.addReactListener(listener)
  }

  showAccountMenu(): void {
    this.getViewControllerManager().accountMenuController.setShow(true)
  }

  hideAccountMenu(): void {
    this.getViewControllerManager().accountMenuController.setShow(false)
  }

  /**
   * Full U2F clients are only web browser clients. They support adding and removing keys as well as authentication.
   * The desktop and mobile clients cannot support adding keys.
   */
  get isFullU2FClient(): boolean {
    return this.environment === Environment.Web
  }

  geDefaultEditorIdentifier(currentTag?: SNTag): EditorIdentifier {
    return (
      currentTag?.preferences?.editorIdentifier ||
      this.getPreference(PrefKey.DefaultEditorIdentifier) ||
      this.componentManager.legacyGetDefaultEditor()?.identifier ||
      FeatureIdentifier.PlainEditor
    )
  }

  openPreferences(pane?: PreferenceId): void {
    this.getViewControllerManager().preferencesController.openPreferences()
    if (pane) {
      this.getViewControllerManager().preferencesController.setCurrentPane(pane)
    }
  }

  generateUUID(): string {
    return this.options.crypto.generateUUID()
  }
}
