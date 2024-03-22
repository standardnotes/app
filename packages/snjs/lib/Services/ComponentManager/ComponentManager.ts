import { FeaturesService } from '@Lib/Services/Features/FeaturesService'
import { ContentType, Uuid } from '@standardnotes/domain-core'
import {
  ActionObserver,
  PayloadEmitSource,
  PermissionDialog,
  Environment,
  Platform,
  ComponentMessage,
  UIFeature,
  ComponentInterface,
  PrefKey,
  ComponentPreferencesEntry,
  AllComponentPreferences,
  SNNote,
  SNTag,
  DeletedItemInterface,
  EncryptedItemInterface,
} from '@standardnotes/models'
import {
  ComponentArea,
  FindNativeFeature,
  EditorFeatureDescription,
  FindNativeTheme,
  IframeComponentFeatureDescription,
  ComponentFeatureDescription,
  ThemeFeatureDescription,
  GetIframeEditors,
  GetNativeThemes,
  NativeFeatureIdentifier,
  GetDeprecatedEditors,
} from '@standardnotes/features'
import { Copy, removeFromArray, sleep, isNotUndefined, LoggerInterface } from '@standardnotes/utils'
import { ComponentViewer } from '@Lib/Services/ComponentManager/ComponentViewer'
import {
  AbstractService,
  ComponentManagerInterface,
  ComponentViewerInterface,
  DesktopManagerInterface,
  InternalEventBusInterface,
  AlertService,
  DeviceInterface,
  isMobileDevice,
  MutatorClientInterface,
  PreferenceServiceInterface,
  ComponentViewerItem,
  PreferencesServiceEvent,
  ItemManagerInterface,
  SyncServiceInterface,
  FeatureStatus,
  LocalPrefKey,
} from '@standardnotes/services'
import { GetFeatureUrl } from './UseCase/GetFeatureUrl'
import { ComponentManagerEventData } from './ComponentManagerEventData'
import { ComponentManagerEvent } from './ComponentManagerEvent'
import { RunWithPermissionsUseCase } from './UseCase/RunWithPermissionsUseCase'
import { EditorForNoteUseCase } from './UseCase/EditorForNote'
import { GetDefaultEditorIdentifier } from './UseCase/GetDefaultEditorIdentifier'
import { DoesEditorChangeRequireAlertUseCase } from './UseCase/DoesEditorChangeRequireAlert'

declare global {
  interface Window {
    /** IE Handlers */
    attachEvent(event: string, listener: EventListener): boolean
    detachEvent(event: string, listener: EventListener): void
  }
}

/**
 * Responsible for orchestrating component functionality, including editors, themes,
 * and other components. The component manager primarily deals with iframes, and orchestrates
 * sending and receiving messages to and from frames via the postMessage API.
 */
export class ComponentManager
  extends AbstractService<ComponentManagerEvent, ComponentManagerEventData>
  implements ComponentManagerInterface
{
  private desktopManager?: DesktopManagerInterface
  private viewers: ComponentViewerInterface[] = []

  private permissionDialogUIHandler: (dialog: PermissionDialog) => void = () => {
    throw 'Must call setPermissionDialogUIHandler'
  }

  private readonly runWithPermissionsUseCase = new RunWithPermissionsUseCase(
    this.permissionDialogUIHandler,
    this.alerts,
    this.mutator,
    this.sync,
    this.items,
  )

  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private features: FeaturesService,
    private preferences: PreferenceServiceInterface,
    protected alerts: AlertService,
    private environment: Environment,
    private platform: Platform,
    private device: DeviceInterface,
    private logger: LoggerInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.loggingEnabled = false

    this.addSyncedComponentItemObserver()
    this.registerMobileNativeComponentUrls()
    this.registerDeprecatedEditorUrlsForAndroid()

    this.eventDisposers.push(
      preferences.addEventObserver((event) => {
        if (event === PreferencesServiceEvent.PreferencesChanged) {
          this.postActiveThemesToAllViewers()
        }
      }),
    )

    window.addEventListener
      ? window.addEventListener('focus', this.detectFocusChange, true)
      : window.attachEvent('onfocusout', this.detectFocusChange)
    window.addEventListener
      ? window.addEventListener('blur', this.detectFocusChange, true)
      : window.attachEvent('onblur', this.detectFocusChange)

    window.addEventListener('message', this.onWindowMessage, true)
  }

  override deinit(): void {
    super.deinit()

    for (const viewer of this.viewers) {
      viewer.destroy()
    }

    this.viewers.length = 0
    this.runWithPermissionsUseCase.deinit()

    this.desktopManager = undefined
    ;(this.items as unknown) = undefined
    ;(this.features as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.preferences as unknown) = undefined
    ;(this.permissionDialogUIHandler as unknown) = undefined

    if (window) {
      window.removeEventListener('focus', this.detectFocusChange, true)
      window.removeEventListener('blur', this.detectFocusChange, true)
      window.removeEventListener('message', this.onWindowMessage, true)
    }

    ;(this.detectFocusChange as unknown) = undefined
    ;(this.onWindowMessage as unknown) = undefined
  }

  public setPermissionDialogUIHandler(handler: (dialog: PermissionDialog) => void): void {
    this.permissionDialogUIHandler = handler
    this.runWithPermissionsUseCase.setPermissionDialogUIHandler(handler)
  }

  public thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[] {
    return this.items.getDisplayableComponents().filter((component) => {
      return component.area === area
    })
  }

  public createComponentViewer(
    component: UIFeature<IframeComponentFeatureDescription>,
    item: ComponentViewerItem,
    actionObserver?: ActionObserver,
  ): ComponentViewerInterface {
    const viewer = new ComponentViewer(
      component,
      {
        items: this.items,
        mutator: this.mutator,
        sync: this.sync,
        alerts: this.alerts,
        preferences: this.preferences,
        features: this.features,
        logger: this.logger,
      },
      {
        url: this.urlForFeature(component) ?? '',
        item,
        actionObserver,
      },
      {
        environment: this.environment,
        platform: this.platform,
        componentManagerFunctions: {
          runWithPermissionsUseCase: this.runWithPermissionsUseCase,
          urlsForActiveThemes: this.urlsForActiveThemes.bind(this),
          setComponentPreferences: this.setComponentPreferences.bind(this),
          getComponentPreferences: this.getComponentPreferences.bind(this),
        },
      },
    )
    this.viewers.push(viewer)
    return viewer
  }

  public destroyComponentViewer(viewer: ComponentViewerInterface): void {
    viewer.destroy()
    removeFromArray(this.viewers, viewer)
  }

  public setDesktopManager(desktopManager: DesktopManagerInterface): void {
    this.desktopManager = desktopManager
    this.configureForDesktop()
  }

  private handleChangedComponents(components: ComponentInterface[], source: PayloadEmitSource): void {
    const acceptableSources = [
      PayloadEmitSource.LocalChanged,
      PayloadEmitSource.RemoteRetrieved,
      PayloadEmitSource.LocalDatabaseLoaded,
      PayloadEmitSource.LocalInserted,
    ]

    if (components.length === 0 || !acceptableSources.includes(source)) {
      return
    }

    if (this.desktopManager) {
      const thirdPartyComponents = components.filter((component) => {
        const nativeFeature = FindNativeFeature(component.identifier)
        return nativeFeature ? false : true
      })

      if (thirdPartyComponents.length > 0) {
        this.desktopManager.syncComponentsInstallation(thirdPartyComponents)
      }
    }

    const themes = components.filter((c) => c.isTheme())
    if (themes.length > 0) {
      this.postActiveThemesToAllViewers()
    }
  }

  private addSyncedComponentItemObserver(): void {
    this.eventDisposers.push(
      this.items.addObserver<ComponentInterface>(
        [ContentType.TYPES.Component, ContentType.TYPES.Theme],
        ({ changed, inserted, removed, source }) => {
          const items = [...changed, ...inserted]

          this.handleChangedComponents(items, source)

          this.updateMobileRegisteredComponentUrls(inserted, removed)
        },
      ),
    )
  }

  private updateMobileRegisteredComponentUrls(
    inserted: ComponentInterface[],
    removed: (EncryptedItemInterface | DeletedItemInterface)[],
  ): void {
    if (!isMobileDevice(this.device)) {
      return
    }

    for (const component of inserted) {
      const feature = new UIFeature<ComponentFeatureDescription>(component)
      const url = this.urlForFeature(feature)
      if (url) {
        this.device.registerComponentUrl(component.uuid, url)
      }
    }

    for (const component of removed) {
      this.device.deregisterComponentUrl(component.uuid)
    }
  }

  private registerMobileNativeComponentUrls(): void {
    if (!isMobileDevice(this.device)) {
      return
    }

    const nativeComponents = [...GetIframeEditors(), ...GetNativeThemes()]

    for (const component of nativeComponents) {
      const feature = new UIFeature<ComponentFeatureDescription>(component)
      const url = this.urlForFeature(feature)

      if (url) {
        this.device.registerComponentUrl(feature.uniqueIdentifier.value, url)
      }
    }
  }

  private registerDeprecatedEditorUrlsForAndroid(): void {
    if (!isMobileDevice(this.device)) {
      return
    }

    const deprecatedEditors = [...GetDeprecatedEditors()]

    for (const component of deprecatedEditors) {
      const feature = new UIFeature<ComponentFeatureDescription>(component)
      const url = this.urlForFeature(feature)

      if (url) {
        this.device.registerComponentUrl(feature.uniqueIdentifier.value, url)
      }
    }
  }

  detectFocusChange = (): void => {
    const activeIframes = Array.from(document.getElementsByTagName('iframe'))

    for (const iframe of activeIframes) {
      if (document.activeElement === iframe) {
        setTimeout(() => {
          const viewer = this.findComponentViewer(
            iframe.dataset.componentViewerId as string,
          ) as ComponentViewerInterface

          void this.notifyEvent(ComponentManagerEvent.ViewerDidFocus, {
            componentViewer: viewer,
          })
        })
        return
      }
    }
  }

  onWindowMessage = (event: MessageEvent): void => {
    const data = event.data as ComponentMessage
    if (data.sessionKey) {
      this.logger.info('Component manager received message', data)
      this.componentViewerForSessionKey(data.sessionKey)?.handleMessage(data)
    }
  }

  private configureForDesktop(): void {
    if (!this.desktopManager) {
      throw new Error('Desktop manager is not defined')
    }

    this.desktopManager.registerUpdateObserver((component: ComponentInterface) => {
      const activeComponents = this.getActiveComponents()
      const isComponentActive = activeComponents.find((candidate) => candidate.uuid === component.uuid)
      if (isComponentActive && component.isTheme()) {
        this.postActiveThemesToAllViewers()
      }
    })
  }

  private postActiveThemesToAllViewers(): void {
    for (const viewer of this.viewers) {
      viewer.postActiveThemes()
    }
  }

  public urlForFeature(uiFeature: UIFeature<ComponentFeatureDescription>): string | undefined {
    const usecase = new GetFeatureUrl(this.desktopManager, this.environment, this.platform)
    return usecase.execute(uiFeature)
  }

  public urlsForActiveThemes(): string[] {
    const themes = this.getActiveThemes()
    const urls = []
    for (const theme of themes) {
      const url = this.urlForFeature(theme)
      if (url) {
        urls.push(url)
      }
    }
    return urls
  }

  private findComponentViewer(identifier: string): ComponentViewerInterface | undefined {
    return this.viewers.find((viewer) => viewer.identifier === identifier)
  }

  public findComponentWithPackageIdentifier(identifier: string): ComponentInterface | undefined {
    return this.items.getDisplayableComponents().find((component) => {
      return component.identifier === identifier
    })
  }

  private componentViewerForSessionKey(key: string): ComponentViewerInterface | undefined {
    return this.viewers.find((viewer) => viewer.sessionKey === key)
  }

  public toggleOtherNonLayerableThemes(uiFeature: UIFeature<ThemeFeatureDescription>): void {
    const activeThemes = this.getActiveThemes()
    for (const candidate of activeThemes) {
      if (candidate.featureIdentifier === uiFeature.featureIdentifier) {
        continue
      }

      if (!candidate.layerable) {
        this.removeActiveTheme(candidate)
      }
    }
  }

  public async toggleTheme(uiFeature: UIFeature<ThemeFeatureDescription>, skipEntitlementCheck = false): Promise<void> {
    this.logger.info('Toggling theme', uiFeature.uniqueIdentifier)

    if (this.isThemeActive(uiFeature)) {
      this.removeActiveTheme(uiFeature)
      return
    }

    const featureStatus = this.features.getFeatureStatus(uiFeature.uniqueIdentifier)
    if (!skipEntitlementCheck && featureStatus !== FeatureStatus.Entitled) {
      return
    }

    /* Activate current before deactivating others, so as not to flicker */
    this.addActiveTheme(uiFeature)

    /* Deactive currently active theme(s) if new theme is not layerable */
    if (!uiFeature.layerable) {
      await sleep(10)

      this.toggleOtherNonLayerableThemes(uiFeature)
    }
  }

  public getActiveThemes(): UIFeature<ThemeFeatureDescription>[] {
    const { features, uuids } = this.getActiveThemesIdentifiers()

    const thirdPartyThemes = uuids
      .map((uuid) => {
        const component = this.items.findItem<ComponentInterface>(uuid.value)
        if (component) {
          return new UIFeature<ThemeFeatureDescription>(component)
        }
        return undefined
      })
      .filter(isNotUndefined)

    const nativeThemes = features
      .map((identifier) => {
        return FindNativeTheme(identifier.value)
      })
      .filter(isNotUndefined)
      .map((theme) => new UIFeature(theme))

    const entitledThemes = [...thirdPartyThemes, ...nativeThemes].filter((theme) => {
      return this.features.getFeatureStatus(theme.uniqueIdentifier) === FeatureStatus.Entitled
    })

    return entitledThemes
  }

  public getActiveThemesIdentifiers(): { features: NativeFeatureIdentifier[]; uuids: Uuid[] } {
    const features: NativeFeatureIdentifier[] = []
    const uuids: Uuid[] = []

    const strings = new Set(this.preferences.getLocalValue(LocalPrefKey.ActiveThemes, []))
    for (const string of strings) {
      const nativeIdentifier = NativeFeatureIdentifier.create(string)
      if (!nativeIdentifier.isFailed()) {
        features.push(nativeIdentifier.getValue())
      }

      const uuid = Uuid.create(string)
      if (!uuid.isFailed()) {
        uuids.push(uuid.getValue())
      }
    }

    return { features, uuids }
  }

  public async toggleComponent(component: ComponentInterface): Promise<void> {
    this.logger.info('Toggling component', component.uuid)

    if (this.isComponentActive(component)) {
      await this.removeActiveComponent(component)
    } else {
      await this.addActiveComponent(component)
    }
  }

  editorForNote(note: SNNote): UIFeature<EditorFeatureDescription | IframeComponentFeatureDescription> {
    const usecase = new EditorForNoteUseCase(this.items)
    return usecase.execute(note)
  }

  getDefaultEditorIdentifier(currentTag?: SNTag): string {
    const usecase = new GetDefaultEditorIdentifier(this.preferences, this.items)
    return usecase.execute(currentTag).getValue()
  }

  doesEditorChangeRequireAlert(
    from: UIFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
    to: UIFeature<IframeComponentFeatureDescription | EditorFeatureDescription> | undefined,
  ): boolean {
    const usecase = new DoesEditorChangeRequireAlertUseCase()
    return usecase.execute(from, to)
  }

  async showEditorChangeAlert(): Promise<boolean> {
    const shouldChangeEditor = await this.alerts.confirm(
      'Doing so might result in minor formatting changes.',
      "Are you sure you want to change this note's type?",
      'Yes, change it',
    )

    return shouldChangeEditor
  }

  async setComponentPreferences(
    uiFeature: UIFeature<ComponentFeatureDescription>,
    preferences: ComponentPreferencesEntry,
  ): Promise<void> {
    const mutablePreferencesValue = Copy<AllComponentPreferences>(
      this.preferences.getValue(PrefKey.ComponentPreferences, undefined) ?? {},
    )

    const preferencesLookupKey = uiFeature.uniqueIdentifier.value

    mutablePreferencesValue[preferencesLookupKey] = preferences

    await this.preferences.setValue(PrefKey.ComponentPreferences, mutablePreferencesValue)
  }

  getComponentPreferences(component: UIFeature<ComponentFeatureDescription>): ComponentPreferencesEntry | undefined {
    const preferences = this.preferences.getValue(PrefKey.ComponentPreferences, undefined)

    if (!preferences) {
      return undefined
    }

    const preferencesLookupKey = component.uniqueIdentifier.value

    return preferences[preferencesLookupKey]
  }

  addActiveTheme(theme: UIFeature<ThemeFeatureDescription>) {
    const activeThemes = this.preferences.getLocalValue(LocalPrefKey.ActiveThemes, []).slice()

    activeThemes.push(theme.uniqueIdentifier.value)

    this.preferences.setLocalValue(LocalPrefKey.ActiveThemes, activeThemes)
  }

  replaceActiveTheme(theme: UIFeature<ThemeFeatureDescription>) {
    this.preferences.setLocalValue(LocalPrefKey.ActiveThemes, [theme.uniqueIdentifier.value])
  }

  removeActiveTheme(theme: UIFeature<ThemeFeatureDescription>) {
    const activeThemes = this.preferences.getLocalValue(LocalPrefKey.ActiveThemes, [])

    const filteredThemes = activeThemes.filter((activeTheme) => activeTheme !== theme.uniqueIdentifier.value)

    this.preferences.setLocalValue(LocalPrefKey.ActiveThemes, filteredThemes)
  }

  isThemeActive(theme: UIFeature<ThemeFeatureDescription>): boolean {
    if (this.features.getFeatureStatus(theme.uniqueIdentifier) !== FeatureStatus.Entitled) {
      return false
    }

    const activeThemes = this.preferences.getLocalValue(LocalPrefKey.ActiveThemes, [])

    return activeThemes.includes(theme.uniqueIdentifier.value)
  }

  async addActiveComponent(component: ComponentInterface): Promise<void> {
    const activeComponents = this.preferences.getValue(PrefKey.ActiveComponents, []).slice()

    activeComponents.push(component.uuid)

    await this.preferences.setValue(PrefKey.ActiveComponents, activeComponents)
  }

  async removeActiveComponent(component: ComponentInterface): Promise<void> {
    const activeComponents = this.preferences.getValue(PrefKey.ActiveComponents, undefined) ?? []

    const filteredComponents = activeComponents.filter((activeComponent) => activeComponent !== component.uuid)

    await this.preferences.setValue(PrefKey.ActiveComponents, filteredComponents)
  }

  getActiveComponents(): ComponentInterface[] {
    const activeComponents = this.preferences.getValue(PrefKey.ActiveComponents, undefined) ?? []

    return this.items.findItems(activeComponents)
  }

  isComponentActive(component: ComponentInterface): boolean {
    const activeComponents = this.preferences.getValue(PrefKey.ActiveComponents, undefined) ?? []

    return activeComponents.includes(component.uuid)
  }
}
