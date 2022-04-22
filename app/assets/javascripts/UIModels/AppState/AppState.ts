import { storage, StorageKey } from '@/Services/LocalStorage'
import { WebApplication, WebAppEvent } from '@/UIModels/Application'
import { AccountMenuState } from '@/UIModels/AppState/AccountMenuState'
import { isDesktopApplication } from '@/Utils'
import {
  ApplicationEvent,
  ContentType,
  DeinitSource,
  NoteViewController,
  PrefKey,
  SNNote,
  SmartView,
  SNTag,
  SystemViewId,
  removeFromArray,
  Uuid,
  PayloadEmitSource,
} from '@standardnotes/snjs'
import { action, computed, IReactionDisposer, makeObservable, observable, reaction } from 'mobx'
import { ActionsMenuState } from './ActionsMenuState'
import { FeaturesState } from './FeaturesState'
import { FilesState } from './FilesState'
import { NotesState } from './NotesState'
import { NotesViewState } from './NotesViewState'
import { NoteTagsState } from './NoteTagsState'
import { NoAccountWarningState } from './NoAccountWarningState'
import { PreferencesState } from './PreferencesState'
import { PurchaseFlowState } from './PurchaseFlowState'
import { QuickSettingsState } from './QuickSettingsState'
import { SearchOptionsState } from './SearchOptionsState'
import { SubscriptionState } from './SubscriptionState'
import { SyncState } from './SyncState'
import { TagsState } from './TagsState'
import { WebOrDesktopDevice } from '@/Device/WebOrDesktopDevice'

export enum AppStateEvent {
  TagChanged,
  ActiveEditorChanged,
  PanelResized,
  EditorFocused,
  BeganBackupDownload,
  EndedBackupDownload,
  WindowDidFocus,
  WindowDidBlur,
}

export type PanelResizedData = {
  panel: string
  collapsed: boolean
}

export enum EventSource {
  UserInteraction,
  Script,
}

type ObserverCallback = (event: AppStateEvent, data?: any) => Promise<void>

export class AppState {
  readonly enableUnfinishedFeatures: boolean = window?.enabledUnfinishedFeatures

  application: WebApplication
  observers: ObserverCallback[] = []
  locked = true
  unsubApp: any
  webAppEventDisposer?: () => void
  onVisibilityChange: any
  showBetaWarning: boolean

  private multiEditorSupport = false

  readonly quickSettingsMenu = new QuickSettingsState()
  readonly accountMenu: AccountMenuState
  readonly actionsMenu = new ActionsMenuState()
  readonly preferences = new PreferencesState()
  readonly purchaseFlow: PurchaseFlowState
  readonly noAccountWarning: NoAccountWarningState
  readonly noteTags: NoteTagsState
  readonly sync = new SyncState()
  readonly searchOptions: SearchOptionsState
  readonly notes: NotesState
  readonly features: FeaturesState
  readonly tags: TagsState
  readonly notesView: NotesViewState
  readonly subscription: SubscriptionState
  readonly files: FilesState

  isSessionsModalVisible = false

  private appEventObserverRemovers: (() => void)[] = []

  private readonly tagChangedDisposer: IReactionDisposer

  constructor(application: WebApplication, private device: WebOrDesktopDevice) {
    this.application = application
    this.notes = new NotesState(
      application,
      this,
      async () => {
        await this.notifyEvent(AppStateEvent.ActiveEditorChanged)
      },
      this.appEventObserverRemovers,
    )
    this.noteTags = new NoteTagsState(application, this, this.appEventObserverRemovers)
    this.features = new FeaturesState(application, this.appEventObserverRemovers)
    this.tags = new TagsState(application, this.appEventObserverRemovers, this.features)
    this.noAccountWarning = new NoAccountWarningState(application, this.appEventObserverRemovers)
    this.accountMenu = new AccountMenuState(application, this.appEventObserverRemovers)
    this.searchOptions = new SearchOptionsState(application, this.appEventObserverRemovers)
    this.subscription = new SubscriptionState(application, this.appEventObserverRemovers)
    this.purchaseFlow = new PurchaseFlowState(application)
    this.notesView = new NotesViewState(application, this, this.appEventObserverRemovers)
    this.files = new FilesState(application)
    this.addAppEventObserver()
    this.streamNotesAndTags()
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
      selectedTag: computed,

      showBetaWarning: observable,
      isSessionsModalVisible: observable,
      preferences: observable,

      enableBetaWarning: action,
      disableBetaWarning: action,
      openSessionsModal: action,
      closeSessionsModal: action,
    })

    this.tagChangedDisposer = this.tagChangedNotifier()
  }

  deinit(source: DeinitSource): void {
    if (source === DeinitSource.SignOut) {
      storage.remove(StorageKey.ShowBetaWarning)
      this.noAccountWarning.reset()
    }
    ;(this.application as unknown) = undefined
    this.actionsMenu.reset()
    this.unsubApp?.()
    this.unsubApp = undefined
    this.observers.length = 0

    this.appEventObserverRemovers.forEach((remover) => remover())
    this.appEventObserverRemovers.length = 0
    ;(this.features as unknown) = undefined

    this.webAppEventDisposer?.()
    this.webAppEventDisposer = undefined
    ;(this.quickSettingsMenu as unknown) = undefined
    ;(this.accountMenu as unknown) = undefined
    ;(this.actionsMenu as unknown) = undefined
    ;(this.preferences as unknown) = undefined
    ;(this.purchaseFlow as unknown) = undefined
    ;(this.noteTags as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.searchOptions as unknown) = undefined
    ;(this.notes as unknown) = undefined
    ;(this.features as unknown) = undefined
    ;(this.tags as unknown) = undefined
    ;(this.notesView as unknown) = undefined

    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.onVisibilityChange = undefined

    this.tagChangedDisposer()
    ;(this.tagChangedDisposer as unknown) = undefined
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

  async openNewNote(title?: string) {
    if (!this.multiEditorSupport) {
      this.closeActiveNoteController()
    }

    const selectedTag = this.selectedTag

    const activeRegularTagUuid =
      selectedTag && selectedTag instanceof SNTag ? selectedTag.uuid : undefined

    await this.application.noteControllerGroup.createNoteView(
      undefined,
      title,
      activeRegularTagUuid,
    )
  }

  getActiveNoteController() {
    return this.application.noteControllerGroup.noteControllers[0]
  }

  getNoteControllers() {
    return this.application.noteControllerGroup.noteControllers
  }

  closeNoteController(controller: NoteViewController) {
    this.application.noteControllerGroup.closeNoteView(controller)
  }

  closeActiveNoteController() {
    this.application.noteControllerGroup.closeActiveNoteView()
  }

  closeAllNoteControllers() {
    this.application.noteControllerGroup.closeAllNoteViews()
  }

  noteControllerForNote(uuid: Uuid) {
    for (const controller of this.getNoteControllers()) {
      if (controller.note.uuid === uuid) {
        return controller
      }
    }
    return undefined
  }

  isGlobalSpellcheckEnabled(): boolean {
    return this.application.getPreference(PrefKey.EditorSpellcheck, true)
  }

  async toggleGlobalSpellcheck() {
    const currentValue = this.isGlobalSpellcheckEnabled()
    return this.application.setPreference(PrefKey.EditorSpellcheck, !currentValue)
  }

  private tagChangedNotifier(): IReactionDisposer {
    return reaction(
      () => this.tags.selectedUuid,
      () => {
        const tag = this.tags.selected
        const previousTag = this.tags.previouslySelected

        if (!tag) {
          return
        }

        if (this.application.items.isTemplateItem(tag)) {
          return
        }

        this.notifyEvent(AppStateEvent.TagChanged, {
          tag,
          previousTag,
        }).catch(console.error)
      },
    )
  }

  public get selectedTag(): SNTag | SmartView | undefined {
    return this.tags.selected
  }

  public set selectedTag(tag: SNTag | SmartView | undefined) {
    this.tags.selected = tag
  }

  streamNotesAndTags() {
    this.application.streamItems<SNNote | SNTag>(
      [ContentType.Note, ContentType.Tag],
      async ({ changed, inserted, removed, source }) => {
        if (![PayloadEmitSource.PreSyncSave, PayloadEmitSource.RemoteRetrieved].includes(source)) {
          return
        }

        const removedNotes = removed.filter((i) => i.content_type === ContentType.Note)

        for (const removedNote of removedNotes) {
          const noteController = this.noteControllerForNote(removedNote.uuid)
          if (noteController) {
            this.closeNoteController(noteController)
          }
        }

        const changedOrInserted = [...changed, ...inserted].filter(
          (i) => i.content_type === ContentType.Note,
        )

        const selectedTag = this.tags.selected

        const isBrowswingTrashedNotes =
          selectedTag instanceof SmartView && selectedTag.uuid === SystemViewId.TrashedNotes

        const isBrowsingArchivedNotes =
          selectedTag instanceof SmartView && selectedTag.uuid === SystemViewId.ArchivedNotes

        for (const note of changedOrInserted) {
          const noteController = this.noteControllerForNote(note.uuid)
          if (!noteController) {
            continue
          }

          if (note.trashed && !isBrowswingTrashedNotes && !this.searchOptions.includeTrashed) {
            this.closeNoteController(noteController)
          } else if (
            note.archived &&
            !isBrowsingArchivedNotes &&
            !this.searchOptions.includeArchived &&
            !this.application.getPreference(PrefKey.NotesShowArchived, false)
          ) {
            this.closeNoteController(noteController)
          }
        }
      },
    )
  }

  addAppEventObserver() {
    this.unsubApp = this.application.addEventObserver(async (eventName) => {
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

  /** @returns  A function that unregisters this observer */
  addObserver(callback: ObserverCallback) {
    this.observers.push(callback)
    return () => {
      removeFromArray(this.observers, callback)
    }
  }

  async notifyEvent(eventName: AppStateEvent, data?: any) {
    /**
     * Timeout is particularly important so we can give all initial
     * controllers a chance to construct before propogting any events *
     */
    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        for (const callback of this.observers) {
          await callback(eventName, data)
        }
        resolve()
      })
    })
  }

  /** Returns the tags that are referncing this note */
  public getNoteTags(note: SNNote) {
    return this.application.items.itemsReferencingItem(note).filter((ref) => {
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
