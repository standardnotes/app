import { AllowedBatchStreaming } from './Types'
import { SNPreferencesService } from '../Preferences/PreferencesService'
import { SNFeaturesService } from '@Lib/Services/Features/FeaturesService'
import { ContentType, DisplayStringForContentType } from '@standardnotes/common'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import {
  ActionObserver,
  SNNote,
  SNTheme,
  SNComponent,
  ComponentMutator,
  PayloadEmitSource,
  PermissionDialog,
  Environment,
  Platform,
} from '@standardnotes/models'
import { SNSyncService } from '@Lib/Services/Sync/SyncService'
import find from 'lodash/find'
import uniq from 'lodash/uniq'
import {
  ComponentArea,
  ComponentAction,
  ComponentPermission,
  FindNativeFeature,
  NoteType,
  FeatureIdentifier,
} from '@standardnotes/features'
import { Copy, filterFromArray, removeFromArray, sleep, assert } from '@standardnotes/utils'
import { UuidString } from '@Lib/Types/UuidString'
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
} from '@standardnotes/services'

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
    private itemManager: ItemManager,
    private syncService: SNSyncService,
    private featuresService: SNFeaturesService,
    private preferencesSerivce: SNPreferencesService,
    protected alertService: AlertService,
    private environment: Environment,
    private platform: Platform,
    protected override internalEventBus: InternalEventBusInterface,
    private device: DeviceInterface,
  ) {
    super(internalEventBus)
    this.loggingEnabled = false

    this.addItemObserver()

    /* On mobile, events listeners are handled by a respective component */
    if (environment !== Environment.Mobile) {
      window.addEventListener
        ? window.addEventListener('focus', this.detectFocusChange, true)
        : window.attachEvent('onfocusout', this.detectFocusChange)
      window.addEventListener
        ? window.addEventListener('blur', this.detectFocusChange, true)
        : window.attachEvent('onblur', this.detectFocusChange)

      window.addEventListener('message', this.onWindowMessage, true)
    }
  }

  get isDesktop(): boolean {
    return this.environment === Environment.Desktop
  }

  get isMobile(): boolean {
    return this.environment === Environment.Mobile
  }

  get components(): SNComponent[] {
    return this.itemManager.getDisplayableComponents()
  }

  componentsForArea(area: ComponentArea): SNComponent[] {
    return this.components.filter((component) => {
      return component.area === area
    })
  }

  componentWithIdentifier(identifier: FeatureIdentifier | string): SNComponent | undefined {
    return this.components.find((component) => component.identifier === identifier)
  }

  override deinit(): void {
    super.deinit()

    for (const viewer of this.viewers) {
      viewer.destroy()
    }

    this.viewers.length = 0
    this.permissionDialogs.length = 0

    this.desktopManager = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.featuresService as unknown) = undefined
    ;(this.syncService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.preferencesSerivce as unknown) = undefined

    this.removeItemObserver?.()
    ;(this.removeItemObserver as unknown) = undefined

    if (window && !this.isMobile) {
      window.removeEventListener('focus', this.detectFocusChange, true)
      window.removeEventListener('blur', this.detectFocusChange, true)
      window.removeEventListener('message', this.onWindowMessage, true)
    }

    ;(this.detectFocusChange as unknown) = undefined
    ;(this.onWindowMessage as unknown) = undefined
  }

  public createComponentViewer(
    component: SNComponent,
    contextItem?: UuidString,
    actionObserver?: ActionObserver,
    urlOverride?: string,
  ): ComponentViewerInterface {
    const viewer = new ComponentViewer(
      component,
      this.itemManager,
      this.syncService,
      this.alertService,
      this.preferencesSerivce,
      this.featuresService,
      this.environment,
      this.platform,
      {
        runWithPermissions: this.runWithPermissions.bind(this),
        urlsForActiveThemes: this.urlsForActiveThemes.bind(this),
      },
      urlOverride || this.urlForComponent(component),
      contextItem,
      actionObserver,
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

  handleChangedComponents(components: SNComponent[], source: PayloadEmitSource): void {
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

  addItemObserver(): void {
    this.removeItemObserver = this.itemManager.addObserver<SNComponent>(
      [ContentType.Component, ContentType.Theme],
      ({ changed, inserted, removed, source }) => {
        const items = [...changed, ...inserted]
        this.handleChangedComponents(items, source)

        const device = this.device
        if (isMobileDevice(device)) {
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
    if (event.data.sessionKey) {
      this.log('Component manager received message', event.data)
      this.componentViewerForSessionKey(event.data.sessionKey)?.handleMessage(event.data)
    }
  }

  configureForDesktop(): void {
    this.desktopManager?.registerUpdateObserver((component: SNComponent) => {
      /* Reload theme if active */
      if (component.active && component.isTheme()) {
        this.postActiveThemesToAllViewers()
      }
    })
  }

  postActiveThemesToAllViewers(): void {
    for (const viewer of this.viewers) {
      viewer.postActiveThemes()
    }
  }

  getActiveThemes(): SNTheme[] {
    if (this.environment === Environment.Mobile) {
      throw Error('getActiveThemes must be handled separately by mobile')
    }
    return this.componentsForArea(ComponentArea.Themes).filter((theme) => {
      return theme.active
    }) as SNTheme[]
  }

  urlForComponent(component: SNComponent): string | undefined {
    const platformSupportsOfflineOnly = this.isDesktop
    if (component.offlineOnly && !platformSupportsOfflineOnly) {
      return undefined
    }

    const nativeFeature = FindNativeFeature(component.identifier)

    if (this.isDesktop) {
      assert(this.desktopManager)

      if (nativeFeature) {
        return `${this.desktopManager.getExtServerHost()}/components/${component.identifier}/${
          nativeFeature.index_path
        }`
      } else if (component.local_url) {
        return component.local_url.replace(DESKTOP_URL_PREFIX, this.desktopManager.getExtServerHost() + '/')
      } else {
        return component.hosted_url || component.legacy_url
      }
    }

    const isWeb = this.environment === Environment.Web
    const isMobile = this.environment === Environment.Mobile
    if (nativeFeature) {
      if (!isWeb && !isMobile) {
        throw Error('Mobile must override urlForComponent to handle native paths')
      }
      let baseUrlRequiredForThemesInsideEditors = window.location.origin
      if (isMobile) {
        baseUrlRequiredForThemesInsideEditors = window.location.href.split('/index.html')[0]
      }
      return `${baseUrlRequiredForThemesInsideEditors}/components/assets/${component.identifier}/${nativeFeature.index_path}`
    }

    let url = component.hosted_url || component.legacy_url
    if (!url) {
      return undefined
    }
    if (this.isMobile) {
      const localReplacement = this.platform === Platform.Ios ? LOCAL_HOST : ANDROID_LOCAL_HOST
      url = url.replace(LOCAL_HOST, localReplacement).replace(CUSTOM_LOCAL_HOST, localReplacement)
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

  private findComponent(uuid: UuidString): SNComponent | undefined {
    return this.itemManager.findItem<SNComponent>(uuid)
  }

  findComponentViewer(identifier: string): ComponentViewerInterface | undefined {
    return this.viewers.find((viewer) => viewer.identifier === identifier)
  }

  componentViewerForSessionKey(key: string): ComponentViewerInterface | undefined {
    return this.viewers.find((viewer) => viewer.sessionKey === key)
  }

  areRequestedPermissionsValid(component: SNComponent, permissions: ComponentPermission[]): boolean {
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
    componentUuid: UuidString,
    requiredPermissions: ComponentPermission[],
    runFunction: () => void,
  ): void {
    const component = this.findComponent(componentUuid)

    if (!component) {
      void this.alertService.alert(
        `Unable to find component with ID ${componentUuid}. Please restart the app and try again.`,
        'An unexpected error occurred',
      )

      return
    }

    if (!this.areRequestedPermissionsValid(component, requiredPermissions)) {
      console.error('Component is requesting invalid permissions', componentUuid, requiredPermissions)
      return
    }

    const nativeFeature = FindNativeFeature(component.identifier)
    const acquiredPermissions = nativeFeature?.component_permissions || component.permissions

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
      for (const acquiredContentType of respectiveAcquired.content_types!) {
        removeFromArray(requiredContentTypes, acquiredContentType)
      }
      if (requiredContentTypes.length === 0) {
        /* We've removed all acquired and end up with zero, means we already have all these permissions */
        filterFromArray(requiredPermissions, required)
      }
    }
    if (requiredPermissions.length > 0) {
      this.promptForPermissionsWithAngularAsyncRendering(
        component,
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

  promptForPermissionsWithAngularAsyncRendering(
    component: SNComponent,
    permissions: ComponentPermission[],
    callback: (approved: boolean) => Promise<void>,
  ): void {
    setTimeout(() => {
      this.promptForPermissions(component, permissions, callback)
    })
  }

  promptForPermissions(
    component: SNComponent,
    permissions: ComponentPermission[],
    callback: (approved: boolean) => Promise<void>,
  ): void {
    const params: PermissionDialog = {
      component: component,
      permissions: permissions,
      permissionsString: this.permissionsStringForPermissions(permissions, component),
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
              matchingPermission.content_types = uniq(contentTypes.concat(permission.content_types!))
            }
          }

          await this.itemManager.changeItem(component, (m) => {
            const mutator = m as ComponentMutator
            mutator.permissions = componentPermissions
          })

          void this.syncService.sync()
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
    const existingDialog = find(this.permissionDialogs, {
      component: component,
    })
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

  async toggleTheme(uuid: UuidString): Promise<void> {
    this.log('Toggling theme', uuid)

    const theme = this.findComponent(uuid) as SNTheme
    if (theme.active) {
      await this.itemManager.changeComponent(theme, (mutator) => {
        mutator.active = false
      })
    } else {
      const activeThemes = this.getActiveThemes()

      /* Activate current before deactivating others, so as not to flicker */
      await this.itemManager.changeComponent(theme, (mutator) => {
        mutator.active = true
      })

      /* Deactive currently active theme(s) if new theme is not layerable */
      if (!theme.isLayerable()) {
        await sleep(10)
        for (const candidate of activeThemes) {
          if (candidate && !candidate.isLayerable()) {
            await this.itemManager.changeComponent(candidate, (mutator) => {
              mutator.active = false
            })
          }
        }
      }
    }
  }

  async toggleComponent(uuid: UuidString): Promise<void> {
    this.log('Toggling component', uuid)

    const component = this.findComponent(uuid)

    if (!component) {
      return
    }

    await this.itemManager.changeComponent(component, (mutator) => {
      mutator.active = !(mutator.getItem() as SNComponent).active
    })
  }

  isComponentActive(component: SNComponent): boolean {
    return component.active
  }

  allComponentIframes(): HTMLIFrameElement[] {
    return Array.from(document.getElementsByTagName('iframe'))
  }

  iframeForComponentViewer(viewer: ComponentViewer): HTMLIFrameElement | undefined {
    return viewer.getIframe()
  }

  editorForNote(note: SNNote): SNComponent | undefined {
    if (note.editorIdentifier) {
      return this.componentWithIdentifier(note.editorIdentifier)
    }

    if (note.noteType === NoteType.Plain) {
      return undefined
    }

    return this.legacyGetEditorForNote(note)
  }

  /**
   * Uses legacy approach of note/editor association. New method uses note.editorIdentifier and note.noteType directly.
   */
  private legacyGetEditorForNote(note: SNNote): SNComponent | undefined {
    const editors = this.componentsForArea(ComponentArea.Editor)
    for (const editor of editors) {
      if (editor.isExplicitlyEnabledForItem(note.uuid)) {
        return editor
      }
    }
    const defaultEditor = this.getDefaultEditor()

    if (defaultEditor && !defaultEditor.isExplicitlyDisabledForItem(note.uuid)) {
      return defaultEditor
    } else {
      return undefined
    }
  }

  getDefaultEditor(): SNComponent | undefined {
    const editors = this.componentsForArea(ComponentArea.Editor)
    return editors.filter((e) => e.isDefaultEditor())[0]
  }

  permissionsStringForPermissions(permissions: ComponentPermission[], component: SNComponent): string {
    if (permissions.length === 0) {
      return '.'
    }

    let contentTypeStrings: string[] = []
    let contextAreaStrings: string[] = []

    permissions.forEach((permission) => {
      switch (permission.name) {
        case ComponentAction.StreamItems:
          if (!permission.content_types) {
            return
          }
          permission.content_types.forEach((contentType) => {
            const desc = DisplayStringForContentType(contentType)
            if (desc) {
              contentTypeStrings.push(`${desc}s`)
            } else {
              contentTypeStrings.push(`items of type ${contentType}`)
            }
          })
          break
        case ComponentAction.StreamContextItem:
          {
            const componentAreaMapping = {
              [ComponentArea.EditorStack]: 'working note',
              [ComponentArea.Editor]: 'working note',
              [ComponentArea.Themes]: 'Unknown',
            }
            contextAreaStrings.push(componentAreaMapping[component.area])
          }
          break
      }
    })

    contentTypeStrings = uniq(contentTypeStrings)
    contextAreaStrings = uniq(contextAreaStrings)

    if (contentTypeStrings.length === 0 && contextAreaStrings.length === 0) {
      return '.'
    }
    return contentTypeStrings.concat(contextAreaStrings).join(', ') + '.'
  }

  doesEditorChangeRequireAlert(from: SNComponent | undefined, to: SNComponent | undefined): boolean {
    const isEitherPlainEditor = !from || !to
    const isEitherMarkdown = from?.package_info.file_type === 'md' || to?.package_info.file_type === 'md'
    const areBothHtml = from?.package_info.file_type === 'html' && to?.package_info.file_type === 'html'

    if (isEitherPlainEditor || isEitherMarkdown || areBothHtml) {
      return false
    } else {
      return true
    }
  }

  async showEditorChangeAlert(): Promise<boolean> {
    const shouldChangeEditor = await this.alertService.confirm(
      'Doing so might result in minor formatting changes.',
      "Are you sure you want to change this note's type?",
      'Yes, change it',
    )

    return shouldChangeEditor
  }
}
