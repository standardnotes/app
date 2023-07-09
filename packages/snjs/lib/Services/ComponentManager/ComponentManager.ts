import { AllowedBatchStreaming } from './Types'
import { SNFeaturesService } from '@Lib/Services/Features/FeaturesService'
import { ContentType } from '@standardnotes/common'
import {
  ActionObserver,
  SNNote,
  ComponentMutator,
  PayloadEmitSource,
  PermissionDialog,
  Environment,
  Platform,
  ComponentMessage,
  ComponentOrNativeFeature,
  isNativeComponent,
  isNonNativeComponent,
  ComponentInterface,
  getComponentOrNativeFeatureFileType,
  ComponentOrNativeFeatureUniqueIdentifier,
  getComponentOrNativeFeatureAcquiredPermissions,
  ComponentOrNativeTheme,
  PrefKey,
  ThemeInterface,
  ComponentPreferencesEntry,
  AllComponentPreferences,
  getComponentOrNativeFeatureUniqueIdentifier,
} from '@standardnotes/models'
import {
  ComponentArea,
  ComponentAction,
  ComponentPermission,
  FindNativeFeature,
  NoteType,
  FeatureIdentifier,
  EditorFeatureDescription,
  GetNativeEditors,
  FindNativeTheme,
} from '@standardnotes/features'
import {
  Copy,
  filterFromArray,
  removeFromArray,
  sleep,
  assert,
  uniqueArray,
  isNotUndefined,
} from '@standardnotes/utils'
import { AllowedBatchContentTypes } from '@Lib/Services/ComponentManager/Types'
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
} from '@standardnotes/services'
import { permissionsStringForPermissions } from './permissionsStringForPermissions'

const DESKTOP_URL_PREFIX = 'sn://'
const LOCAL_HOST = 'localhost'
const CUSTOM_LOCAL_HOST = 'sn.local'
const ANDROID_LOCAL_HOST = '10.0.2.2'

declare global {
  interface Window {
    /** IE Handlers */
    attachEvent(event: string, listener: EventListener): boolean
    detachEvent(event: string, listener: EventListener): void
  }
}

export enum ComponentManagerEvent {
  ViewerDidFocus = 'ViewerDidFocus',
}

export type EventData = {
  componentViewer?: ComponentViewerInterface
}

/**
 * Responsible for orchestrating component functionality, including editors, themes,
 * and other components. The component manager primarily deals with iframes, and orchestrates
 * sending and receiving messages to and from frames via the postMessage API.
 */
export class SNComponentManager
  extends AbstractService<ComponentManagerEvent, EventData>
  implements ComponentManagerInterface
{
  private desktopManager?: DesktopManagerInterface
  private viewers: ComponentViewerInterface[] = []
  private removeItemObserver!: () => void
  private permissionDialogs: PermissionDialog[] = []

  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private features: SNFeaturesService,
    private preferences: PreferenceServiceInterface,
    protected alerts: AlertService,
    private environment: Environment,
    private platform: Platform,
    private device: DeviceInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.loggingEnabled = false

    this.addItemObserver()

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

  get isDesktop(): boolean {
    return this.environment === Environment.Desktop
  }

  get isMobile(): boolean {
    return this.environment === Environment.Mobile
  }

  get thirdPartyComponents(): ComponentInterface[] {
    return this.items.getDisplayableComponents()
  }

  thirdPartyComponentsForArea(area: ComponentArea): ComponentInterface[] {
    return this.thirdPartyComponents.filter((component) => {
      return component.area === area
    })
  }

  componentOrNativeFeatureForIdentifier(identifier: FeatureIdentifier | string): ComponentOrNativeFeature | undefined {
    const nativeFeature = FindNativeFeature(identifier as FeatureIdentifier)
    if (nativeFeature) {
      return nativeFeature
    }

    return this.thirdPartyComponents.find((component) => component.identifier === identifier)
  }

  override deinit(): void {
    super.deinit()

    for (const viewer of this.viewers) {
      viewer.destroy()
    }

    this.viewers.length = 0
    this.permissionDialogs.length = 0

    this.desktopManager = undefined
    ;(this.items as unknown) = undefined
    ;(this.features as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.alerts as unknown) = undefined
    ;(this.preferences as unknown) = undefined

    this.removeItemObserver?.()
    ;(this.removeItemObserver as unknown) = undefined

    if (window) {
      window.removeEventListener('focus', this.detectFocusChange, true)
      window.removeEventListener('blur', this.detectFocusChange, true)
      window.removeEventListener('message', this.onWindowMessage, true)
    }

    ;(this.detectFocusChange as unknown) = undefined
    ;(this.onWindowMessage as unknown) = undefined
  }

  public createComponentViewer(
    component: ComponentOrNativeFeature,
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
      },
      {
        url: this.urlForComponent(component) ?? '',
        item,
        actionObserver,
      },
      {
        environment: this.environment,
        platform: this.platform,
        componentManagerFunctions: {
          runWithPermissions: this.runWithPermissions.bind(this),
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

  setDesktopManager(desktopManager: DesktopManagerInterface): void {
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

    if (this.isDesktop) {
      const thirdPartyComponents = components.filter((component) => {
        const nativeFeature = FindNativeFeature(component.identifier)
        return nativeFeature ? false : true
      })
      if (thirdPartyComponents.length > 0) {
        this.desktopManager?.syncComponentsInstallation(thirdPartyComponents)
      }
    }

    const themes = components.filter((c) => c.isTheme())
    if (themes.length > 0) {
      this.postActiveThemesToAllViewers()
    }
  }

  private addItemObserver(): void {
    this.removeItemObserver = this.items.addObserver<ComponentInterface>(
      [ContentType.Component, ContentType.Theme],
      ({ changed, inserted, removed, source }) => {
        const items = [...changed, ...inserted]
        this.handleChangedComponents(items, source)

        const device = this.device
        if (isMobileDevice(device) && 'addComponentUrl' in device) {
          inserted.forEach((component) => {
            const url = this.urlForComponent(component)
            if (url) {
              device.addComponentUrl(component.uuid, url)
            }
          })

          removed.forEach((component) => {
            device.removeComponentUrl(component.uuid)
          })
        }
      },
    )
  }

  detectFocusChange = (): void => {
    const activeIframes = this.allComponentIframes()
    for (const iframe of activeIframes) {
      if (document.activeElement === iframe) {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const viewer = this.findComponentViewer(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            iframe.dataset.componentViewerId!,
          )!
          void this.notifyEvent(ComponentManagerEvent.ViewerDidFocus, {
            componentViewer: viewer,
          })
        })
        return
      }
    }
  }

  onWindowMessage = (event: MessageEvent): void => {
    /** Make sure this message is for us */
    const data = event.data as ComponentMessage
    if (data.sessionKey) {
      this.log('Component manager received message', data)
      this.componentViewerForSessionKey(data.sessionKey)?.handleMessage(data)
    }
  }

  configureForDesktop(): void {
    this.desktopManager?.registerUpdateObserver((component: ComponentInterface) => {
      /* Reload theme if active */
      const activeComponents = this.getActiveComponents()
      const isComponentActive = activeComponents.find((candidate) => candidate.uuid === component.uuid)
      if (isComponentActive && component.isTheme()) {
        this.postActiveThemesToAllViewers()
      }
    })
  }

  postActiveThemesToAllViewers(): void {
    for (const viewer of this.viewers) {
      viewer.postActiveThemes()
    }
  }

  private urlForComponentOnDesktop(component: ComponentOrNativeFeature): string | undefined {
    assert(this.desktopManager)

    if (isNativeComponent(component)) {
      const nativeFeature = FindNativeFeature(component.identifier)
      assert(nativeFeature)

      return `${this.desktopManager.getExtServerHost()}/components/${component.identifier}/${nativeFeature.index_path}`
    }

    if (component.local_url) {
      return component.local_url.replace(DESKTOP_URL_PREFIX, this.desktopManager.getExtServerHost() + '/')
    }

    return component.hosted_url || component.legacy_url
  }

  private urlForNativeComponent(component: ComponentOrNativeFeature): string {
    const nativeFeature = FindNativeFeature(component.identifier)
    if (!nativeFeature) {
      throw Error(`Could not find native feature for component ${component.identifier}`)
    }

    if (this.isMobile) {
      const baseUrlRequiredForThemesInsideEditors = window.location.href.split('/index.html')[0]
      return `${baseUrlRequiredForThemesInsideEditors}/web-src/components/assets/${component.identifier}/${nativeFeature.index_path}`
    } else {
      const baseUrlRequiredForThemesInsideEditors = window.location.origin
      return `${baseUrlRequiredForThemesInsideEditors}/components/assets/${component.identifier}/${nativeFeature.index_path}`
    }
  }

  urlForComponent(component: ComponentOrNativeFeature): string | undefined {
    if (this.desktopManager) {
      return this.urlForComponentOnDesktop(component)
    }

    if (isNonNativeComponent(component) && component.offlineOnly) {
      return undefined
    }

    if (isNativeComponent(component)) {
      return this.urlForNativeComponent(component)
    }

    const url = component.hosted_url || component.legacy_url
    if (!url) {
      return undefined
    }

    if (this.isMobile) {
      const localReplacement = this.platform === Platform.Ios ? LOCAL_HOST : ANDROID_LOCAL_HOST
      return url.replace(LOCAL_HOST, localReplacement).replace(CUSTOM_LOCAL_HOST, localReplacement)
    }

    return url
  }

  urlsForActiveThemes(): string[] {
    const themes = this.getActiveThemes()
    const urls = []
    for (const theme of themes) {
      const url = this.urlForComponent(theme)
      if (url) {
        urls.push(url)
      }
    }
    return urls
  }

  private findComponent(uuid: string): ComponentInterface | undefined {
    return this.items.findItem<ComponentInterface>(uuid)
  }

  private findComponentOrNativeFeature(
    identifier: ComponentOrNativeFeatureUniqueIdentifier,
  ): ComponentOrNativeFeature | undefined {
    const nativeFeature = FindNativeFeature(identifier as FeatureIdentifier)
    if (nativeFeature) {
      return nativeFeature
    }

    return this.items.findItem<ComponentInterface>(identifier)
  }

  findComponentViewer(identifier: string): ComponentViewerInterface | undefined {
    return this.viewers.find((viewer) => viewer.identifier === identifier)
  }

  componentViewerForSessionKey(key: string): ComponentViewerInterface | undefined {
    return this.viewers.find((viewer) => viewer.sessionKey === key)
  }

  areRequestedPermissionsValid(component: ComponentOrNativeFeature, permissions: ComponentPermission[]): boolean {
    for (const permission of permissions) {
      if (permission.name === ComponentAction.StreamItems) {
        if (!AllowedBatchStreaming.includes(component.identifier)) {
          return false
        }
        const hasNonAllowedBatchPermission = permission.content_types?.some(
          (type) => !AllowedBatchContentTypes.includes(type),
        )
        if (hasNonAllowedBatchPermission) {
          return false
        }
      }
    }

    return true
  }

  runWithPermissions(
    componentIdentifier: ComponentOrNativeFeatureUniqueIdentifier,
    requiredPermissions: ComponentPermission[],
    runFunction: () => void,
  ): void {
    const componentOrNativeFeature = this.findComponentOrNativeFeature(componentIdentifier)

    if (!componentOrNativeFeature) {
      void this.alerts.alert(
        `Unable to find component with ID ${componentIdentifier}. Please restart the app and try again.`,
        'An unexpected error occurred',
      )

      return
    }

    if (isNativeComponent(componentOrNativeFeature)) {
      runFunction()
      return
    }

    if (!this.areRequestedPermissionsValid(componentOrNativeFeature, requiredPermissions)) {
      console.error('Component is requesting invalid permissions', componentIdentifier, requiredPermissions)
      return
    }

    const acquiredPermissions = getComponentOrNativeFeatureAcquiredPermissions(componentOrNativeFeature)

    /* Make copy as not to mutate input values */
    requiredPermissions = Copy(requiredPermissions) as ComponentPermission[]
    for (const required of requiredPermissions.slice()) {
      /* Remove anything we already have */
      const respectiveAcquired = acquiredPermissions.find((candidate) => candidate.name === required.name)
      if (!respectiveAcquired) {
        continue
      }
      /* We now match on name, lets substract from required.content_types anything we have in acquired. */
      const requiredContentTypes = required.content_types
      if (!requiredContentTypes) {
        /* If this permission does not require any content types (i.e stream-context-item)
          then we can remove this from required since we match by name (respectiveAcquired.name === required.name) */
        filterFromArray(requiredPermissions, required)
        continue
      }
      for (const acquiredContentType of respectiveAcquired.content_types as ContentType[]) {
        removeFromArray(requiredContentTypes, acquiredContentType)
      }
      if (requiredContentTypes.length === 0) {
        /* We've removed all acquired and end up with zero, means we already have all these permissions */
        filterFromArray(requiredPermissions, required)
      }
    }
    if (requiredPermissions.length > 0) {
      this.promptForPermissionsWithDeferredRendering(
        componentOrNativeFeature,
        requiredPermissions,
        // eslint-disable-next-line @typescript-eslint/require-await
        async (approved) => {
          if (approved) {
            runFunction()
          }
        },
      )
    } else {
      runFunction()
    }
  }

  promptForPermissionsWithDeferredRendering(
    component: ComponentInterface,
    permissions: ComponentPermission[],
    callback: (approved: boolean) => Promise<void>,
  ): void {
    setTimeout(() => {
      this.promptForPermissions(component, permissions, callback)
    })
  }

  promptForPermissions(
    component: ComponentInterface,
    permissions: ComponentPermission[],
    callback: (approved: boolean) => Promise<void>,
  ): void {
    const params: PermissionDialog = {
      component: component,
      permissions: permissions,
      permissionsString: permissionsStringForPermissions(permissions, component),
      actionBlock: callback,
      callback: async (approved: boolean) => {
        const latestComponent = this.findComponent(component.uuid)

        if (!latestComponent) {
          return
        }

        if (approved) {
          this.log('Changing component to expand permissions', component)
          const componentPermissions = Copy(latestComponent.permissions) as ComponentPermission[]
          for (const permission of permissions) {
            const matchingPermission = componentPermissions.find((candidate) => candidate.name === permission.name)
            if (!matchingPermission) {
              componentPermissions.push(permission)
            } else {
              /* Permission already exists, but content_types may have been expanded */
              const contentTypes = matchingPermission.content_types || []
              matchingPermission.content_types = uniqueArray(
                contentTypes.concat(permission.content_types as ContentType[]),
              )
            }
          }

          await this.mutator.changeItem(component, (m) => {
            const mutator = m as ComponentMutator
            mutator.permissions = componentPermissions
          })

          void this.sync.sync()
        }

        this.permissionDialogs = this.permissionDialogs.filter((pendingDialog) => {
          /* Remove self */
          if (pendingDialog === params) {
            pendingDialog.actionBlock && pendingDialog.actionBlock(approved)
            return false
          }
          const containsObjectSubset = (source: ComponentPermission[], target: ComponentPermission[]) => {
            return !target.some((val) => !source.find((candidate) => JSON.stringify(candidate) === JSON.stringify(val)))
          }
          if (pendingDialog.component === component) {
            /* remove pending dialogs that are encapsulated by already approved permissions, and run its function */
            if (
              pendingDialog.permissions === permissions ||
              containsObjectSubset(permissions, pendingDialog.permissions)
            ) {
              /* If approved, run the action block. Otherwise, if canceled, cancel any
              pending ones as well, since the user was explicit in their intentions */
              if (approved) {
                pendingDialog.actionBlock && pendingDialog.actionBlock(approved)
              }
              return false
            }
          }
          return true
        })

        if (this.permissionDialogs.length > 0) {
          this.presentPermissionsDialog(this.permissionDialogs[0])
        }
      },
    }
    /**
     * Since these calls are asyncronous, multiple dialogs may be requested at the same time.
     * We only want to present one and trigger all callbacks based on one modal result
     */
    const existingDialog = this.permissionDialogs.find((dialog) => dialog.component === component)
    this.permissionDialogs.push(params)
    if (!existingDialog) {
      this.presentPermissionsDialog(params)
    } else {
      this.log('Existing dialog, not presenting.')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  presentPermissionsDialog(_dialog: PermissionDialog): void {
    throw 'Must override SNComponentManager.presentPermissionsDialog'
  }

  async toggleTheme(theme: ComponentOrNativeTheme): Promise<void> {
    this.log('Toggling theme', getComponentOrNativeFeatureUniqueIdentifier(theme))

    if (this.isThemeActive(theme)) {
      await this.removeActiveTheme(theme)
    } else {
      /* Activate current before deactivating others, so as not to flicker */
      await this.addActiveTheme(theme)

      /* Deactive currently active theme(s) if new theme is not layerable */
      if (!theme.layerable) {
        await sleep(10)

        const activeThemes = this.getActiveThemes()
        for (const candidate of activeThemes) {
          if (candidate.identifier === theme.identifier) {
            continue
          }

          if (!candidate.layerable) {
            await this.removeActiveTheme(candidate)
          }
        }
      }
    }
  }

  getActiveThemes(): ComponentOrNativeTheme[] {
    const activeThemesIdentifiers = this.getActiveThemesIdentifiers()

    const thirdPartyThemes = this.items.findItems<ThemeInterface>(activeThemesIdentifiers)

    const nativeThemes = activeThemesIdentifiers
      .map((identifier) => {
        return FindNativeTheme(identifier as FeatureIdentifier)
      })
      .filter(isNotUndefined)

    return [...thirdPartyThemes, ...nativeThemes]
  }

  getActiveThemesIdentifiers(): string[] {
    return this.preferences.getValue(PrefKey.ActiveThemes, undefined) ?? []
  }

  async toggleComponent(component: ComponentInterface): Promise<void> {
    this.log('Toggling component', component.uuid)

    if (this.isComponentActive(component)) {
      await this.removeActiveComponent(component)
    } else {
      await this.addActiveComponent(component)
    }
  }

  allComponentIframes(): HTMLIFrameElement[] {
    return Array.from(document.getElementsByTagName('iframe'))
  }

  iframeForComponentViewer(viewer: ComponentViewer): HTMLIFrameElement | undefined {
    return viewer.getIframe()
  }

  editorForNote(note: SNNote): ComponentOrNativeFeature | undefined {
    if (note.noteType === NoteType.Plain || note.noteType === NoteType.Super) {
      return undefined
    }

    if (note.editorIdentifier) {
      return this.componentOrNativeFeatureForIdentifier(note.editorIdentifier)
    }

    if (note.noteType) {
      return this.nativeEditorForNoteType(note.noteType)
    }

    return this.legacyGetEditorForNote(note)
  }

  private nativeEditorForNoteType(noteType: NoteType): EditorFeatureDescription | undefined {
    const nativeEditors = GetNativeEditors()
    return nativeEditors.find((editor) => editor.note_type === noteType)
  }

  /**
   * Uses legacy approach of note/editor association. New method uses note.editorIdentifier and note.noteType directly.
   */
  private legacyGetEditorForNote(note: SNNote): ComponentInterface | undefined {
    const editors = this.thirdPartyComponentsForArea(ComponentArea.Editor)
    for (const editor of editors) {
      if (editor.isExplicitlyEnabledForItem(note.uuid)) {
        return editor
      }
    }
    const defaultEditor = this.legacyGetDefaultEditor()

    if (defaultEditor && !defaultEditor.isExplicitlyDisabledForItem(note.uuid)) {
      return defaultEditor
    } else {
      return undefined
    }
  }

  legacyGetDefaultEditor(): ComponentInterface | undefined {
    const editors = this.thirdPartyComponentsForArea(ComponentArea.Editor)
    return editors.filter((e) => e.legacyIsDefaultEditor())[0]
  }

  doesEditorChangeRequireAlert(
    from: ComponentOrNativeFeature | undefined,
    to: ComponentOrNativeFeature | undefined,
  ): boolean {
    if (!from || !to) {
      return false
    }

    const fromFileType = getComponentOrNativeFeatureFileType(from)
    const toFileType = getComponentOrNativeFeatureFileType(to)
    const isEitherMarkdown = fromFileType === 'md' || toFileType === 'md'
    const areBothHtml = fromFileType === 'html' && toFileType === 'html'

    if (isEitherMarkdown || areBothHtml) {
      return false
    } else {
      return true
    }
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
    component: ComponentOrNativeFeature,
    preferences: ComponentPreferencesEntry,
  ): Promise<void> {
    const mutablePreferencesValue = Copy<AllComponentPreferences>(
      this.preferences.getValue(PrefKey.ComponentPreferences, undefined) ?? {},
    )

    const preferencesLookupKey = isNativeComponent(component) ? component.identifier : component.uuid

    mutablePreferencesValue[preferencesLookupKey] = preferences

    await this.preferences.setValue(PrefKey.ComponentPreferences, mutablePreferencesValue)
  }

  getComponentPreferences(component: ComponentOrNativeFeature): ComponentPreferencesEntry | undefined {
    const preferences = this.preferences.getValue(PrefKey.ComponentPreferences, undefined)

    if (!preferences) {
      return undefined
    }

    const preferencesLookupKey = isNativeComponent(component) ? component.identifier : component.uuid

    return preferences[preferencesLookupKey]
  }

  async addActiveTheme(theme: ComponentOrNativeTheme): Promise<void> {
    const activeThemes = (this.preferences.getValue(PrefKey.ActiveThemes, undefined) ?? []).slice()

    activeThemes.push(getComponentOrNativeFeatureUniqueIdentifier(theme))

    await this.preferences.setValue(PrefKey.ActiveThemes, activeThemes)
  }

  async replaceActiveTheme(theme: ComponentOrNativeTheme): Promise<void> {
    await this.preferences.setValue(PrefKey.ActiveThemes, [getComponentOrNativeFeatureUniqueIdentifier(theme)])
  }

  async removeActiveTheme(theme: ComponentOrNativeTheme): Promise<void> {
    const activeThemes = this.preferences.getValue(PrefKey.ActiveThemes, undefined) ?? []

    const filteredThemes = activeThemes.filter(
      (activeTheme) => activeTheme !== getComponentOrNativeFeatureUniqueIdentifier(theme),
    )

    await this.preferences.setValue(PrefKey.ActiveThemes, filteredThemes)
  }

  isThemeActive(theme: ComponentOrNativeTheme): boolean {
    const activeThemes = this.preferences.getValue(PrefKey.ActiveThemes, undefined) ?? []

    return activeThemes.includes(getComponentOrNativeFeatureUniqueIdentifier(theme))
  }

  async addActiveComponent(component: ComponentInterface): Promise<void> {
    const activeComponents = (this.preferences.getValue(PrefKey.ActiveComponents, undefined) ?? []).slice()

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
