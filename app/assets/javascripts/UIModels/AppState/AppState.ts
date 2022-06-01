import { storage, StorageKey } from '@/Services/LocalStorage'
import { WebApplication, WebAppEvent } from '@/UIModels/Application'
import { AccountMenuState } from '@/UIModels/AppState/AccountMenuState'
import { destroyAllObjectProperties, isDesktopApplication } from '@/Utils'
import {
  ApplicationEvent,
  ContentType,
  DeinitSource,
  PrefKey,
  SNTag,
  removeFromArray,
  WebOrDesktopDeviceInterface,
} from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { ActionsMenuState } from './ActionsMenuState'
import { FeaturesState } from './FeaturesState'
import { FilesState } from './FilesState'
import { NotesState } from './NotesState'
import { ContentListViewState } from './ContentListViewState'
import { NoteTagsState } from './NoteTagsState'
import { NoAccountWarningState } from './NoAccountWarningState'
import { PreferencesState } from './PreferencesState'
import { PurchaseFlowState } from './PurchaseFlowState'
import { QuickSettingsState } from './QuickSettingsState'
import { SearchOptionsState } from './SearchOptionsState'
import { SubscriptionState } from './SubscriptionState'
import { SyncState } from './SyncState'
import { TagsState } from './TagsState'
import { FilePreviewModalState } from './FilePreviewModalState'
import { AbstractState } from './AbstractState'
import { SelectedItemsState } from './SelectedItemsState'
import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { AppStateEvent } from './AppStateEvent'
import { EventSource } from './EventSource'

export type PanelResizedData = {
  panel: string
  collapsed: boolean
}

type ObserverCallback = (event: AppStateEvent, data?: unknown) => Promise<void>

export class AppState extends AbstractState {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures

  observers: ObserverCallback[] = []
  locked = true
  unsubAppEventObserver!: () => void
  webAppEventDisposer?: () => void
  onVisibilityChange: () => void
  showBetaWarning: boolean

  readonly accountMenu: AccountMenuState
  readonly actionsMenu = new ActionsMenuState()
  readonly features: FeaturesState
  readonly filePreviewModal = new FilePreviewModalState()
  readonly files: FilesState
  readonly noAccountWarning: NoAccountWarningState
  readonly notes: NotesState
  readonly contentListView: ContentListViewState
  readonly noteTags: NoteTagsState
  readonly preferences = new PreferencesState()
  readonly purchaseFlow: PurchaseFlowState
  readonly quickSettingsMenu = new QuickSettingsState()
  readonly searchOptions: SearchOptionsState
  readonly subscription: SubscriptionState
  readonly sync = new SyncState()
  readonly tags: TagsState
  readonly selectedItems: SelectedItemsState

  isSessionsModalVisible = false

  private appEventObserverRemovers: (() => void)[] = []

  constructor(application: WebApplication, private device: WebOrDesktopDeviceInterface) {
    super(application)

    this.selectedItems = new SelectedItemsState(application, this, this.appEventObserverRemovers)
    this.notes = new NotesState(
      application,
      this,
      async () => {
        await this.notifyEvent(AppStateEvent.ActiveEditorChanged)
      },
      this.appEventObserverRemovers,
    )
    this.features = new FeaturesState(application, this.appEventObserverRemovers)
    this.tags = new TagsState(application, this, this.appEventObserverRemovers, this.features)
    this.searchOptions = new SearchOptionsState(application, this.appEventObserverRemovers)
    this.contentListView = new ContentListViewState(application, this, this.appEventObserverRemovers)
    this.noteTags = new NoteTagsState(application, this, this.appEventObserverRemovers)
    this.noAccountWarning = new NoAccountWarningState(application, this.appEventObserverRemovers)
    this.accountMenu = new AccountMenuState(application, this.appEventObserverRemovers)
    this.subscription = new SubscriptionState(application, this.appEventObserverRemovers)
    this.purchaseFlow = new PurchaseFlowState(application)
    this.files = new FilesState(application, this, this.appEventObserverRemovers)
    this.addAppEventObserver()
    this.onVisibilityChange = () => {
      const visible = document.visibilityState === 'visible'
      const event = visible ? AppStateEvent.WindowDidFocus : AppStateEvent.WindowDidBlur
      this.notifyEvent(event).catch(console.error)
    }
    this.registerVisibilityObservers()

    if (this.device.appVersion.includes('-beta')) {
      this.showBetaWarning = storage.get(StorageKey.ShowBetaWarning) ?? true
    } else {
      this.showBetaWarning = false
    }

    makeObservable(this, {
      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferences: observable,

      enableBetaWarning: action,
      disableBetaWarning: action,
      openSessionsModal: action,
      closeSessionsModal: action,
    })
  }

  override deinit(source: DeinitSource): void {
    super.deinit(source)

    if (source === DeinitSource.SignOut) {
      storage.remove(StorageKey.ShowBetaWarning)
      this.noAccountWarning.reset()
    }

    this.unsubAppEventObserver?.()
    ;(this.unsubAppEventObserver as unknown) = undefined
    this.observers.length = 0

    this.appEventObserverRemovers.forEach((remover) => remover())
    this.appEventObserverRemovers.length = 0
    ;(this.device as unknown) = undefined

    this.webAppEventDisposer?.()
    this.webAppEventDisposer = undefined
    ;(this.filePreviewModal as unknown) = undefined
    ;(this.preferences as unknown) = undefined
    ;(this.quickSettingsMenu as unknown) = undefined
    ;(this.sync as unknown) = undefined

    this.actionsMenu.reset()
    ;(this.actionsMenu as unknown) = undefined

    this.features.deinit(source)
    ;(this.features as unknown) = undefined

    this.accountMenu.deinit(source)
    ;(this.accountMenu as unknown) = undefined

    this.files.deinit(source)
    ;(this.files as unknown) = undefined

    this.noAccountWarning.deinit(source)
    ;(this.noAccountWarning as unknown) = undefined

    this.notes.deinit(source)
    ;(this.notes as unknown) = undefined

    this.contentListView.deinit(source)
    ;(this.contentListView as unknown) = undefined

    this.noteTags.deinit(source)
    ;(this.noteTags as unknown) = undefined

    this.purchaseFlow.deinit(source)
    ;(this.purchaseFlow as unknown) = undefined

    this.searchOptions.deinit(source)
    ;(this.searchOptions as unknown) = undefined

    this.subscription.deinit(source)
    ;(this.subscription as unknown) = undefined

    this.tags.deinit(source)
    ;(this.tags as unknown) = undefined

    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    ;(this.onVisibilityChange as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  openSessionsModal(): void {
    this.isSessionsModalVisible = true
  }

  closeSessionsModal(): void {
    this.isSessionsModalVisible = false
  }

  disableBetaWarning() {
    this.showBetaWarning = false
    storage.set(StorageKey.ShowBetaWarning, false)
  }

  enableBetaWarning() {
    this.showBetaWarning = true
    storage.set(StorageKey.ShowBetaWarning, true)
  }

  public get version(): string {
    return this.device.appVersion
  }

  isGlobalSpellcheckEnabled(): boolean {
    return this.application.getPreference(PrefKey.EditorSpellcheck, true)
  }

  async toggleGlobalSpellcheck() {
    const currentValue = this.isGlobalSpellcheckEnabled()
    return this.application.setPreference(PrefKey.EditorSpellcheck, !currentValue)
  }

  addAppEventObserver() {
    this.unsubAppEventObserver = this.application.addEventObserver(async (eventName) => {
      switch (eventName) {
        case ApplicationEvent.Started:
          this.locked = true
          break
        case ApplicationEvent.Launched:
          this.locked = false
          if (window.location.search.includes('purchase=true')) {
            this.purchaseFlow.openPurchaseFlow()
          }
          break
        case ApplicationEvent.SyncStatusChanged:
          this.sync.update(this.application.sync.getSyncStatus())
          break
      }
    })
  }

  isLocked() {
    return this.locked
  }

  registerVisibilityObservers() {
    if (isDesktopApplication()) {
      this.webAppEventDisposer = this.application.addWebEventObserver((event) => {
        if (event === WebAppEvent.DesktopWindowGainedFocus) {
          this.notifyEvent(AppStateEvent.WindowDidFocus).catch(console.error)
        } else if (event === WebAppEvent.DesktopWindowLostFocus) {
          this.notifyEvent(AppStateEvent.WindowDidBlur).catch(console.error)
        }
      })
    } else {
      /* Tab visibility listener, web only */
      document.addEventListener('visibilitychange', this.onVisibilityChange)
    }
  }

  addObserver(callback: ObserverCallback): () => void {
    this.observers.push(callback)

    const thislessObservers = this.observers
    return () => {
      removeFromArray(thislessObservers, callback)
    }
  }

  async notifyEvent(eventName: AppStateEvent, data?: unknown) {
    for (const callback of this.observers) {
      await callback(eventName, data)
    }
  }

  /** Returns the tags that are referncing this note */
  public getItemTags(item: ListableContentItem) {
    return this.application.items.itemsReferencingItem(item).filter((ref) => {
      return ref.content_type === ContentType.Tag
    }) as SNTag[]
  }

  panelDidResize(name: string, collapsed: boolean) {
    const data: PanelResizedData = {
      panel: name,
      collapsed: collapsed,
    }
    this.notifyEvent(AppStateEvent.PanelResized, data).catch(console.error)
  }

  editorDidFocus(eventSource: EventSource) {
    this.notifyEvent(AppStateEvent.EditorFocused, { eventSource: eventSource }).catch(console.error)
  }

  beganBackupDownload() {
    this.notifyEvent(AppStateEvent.BeganBackupDownload).catch(console.error)
  }

  endedBackupDownload(success: boolean) {
    this.notifyEvent(AppStateEvent.EndedBackupDownload, { success: success }).catch(console.error)
  }
}
