import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  CollectionSort,
  ContentType,
  DeinitSource,
  findInArray,
  NoteViewController,
  PrefKey,
  SmartView,
  SNNote,
  SNTag,
  SystemViewId,
  DisplayOptions,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx'
import { AppState, AppStateEvent } from '.'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'
import { WebDisplayOptions } from './WebDisplayOptions'

const MIN_NOTE_CELL_HEIGHT = 51.0
const DEFAULT_LIST_NUM_NOTES = 20
const ELEMENT_ID_SEARCH_BAR = 'search-bar'
const ELEMENT_ID_SCROLL_CONTAINER = 'notes-scrollable'

export class ContentListViewState extends AbstractState {
  completedFullSync = false
  noteFilterText = ''
  notes: SNNote[] = []
  items: ListableContentItem[] = []
  notesToDisplay = 0
  pageSize = 0
  panelTitle = 'All Notes'
  panelWidth = 0
  renderedItems: ListableContentItem[] = []
  searchSubmitted = false
  showDisplayOptionsMenu = false
  displayOptions: DisplayOptions = {
    sortBy: CollectionSort.CreatedAt,
    sortDirection: 'dsc',
    includePinned: true,
    includeArchived: false,
    includeTrashed: false,
    includeProtected: true,
  }
  webDisplayOptions: WebDisplayOptions = {
    hideTags: true,
    hideDate: false,
    hideNotePreview: false,
    hideEditorIcon: false,
  }
  private reloadItemsPromise?: Promise<unknown>

  override deinit(source: DeinitSource) {
    super.deinit(source)
    ;(this.noteFilterText as unknown) = undefined
    ;(this.notes as unknown) = undefined
    ;(this.renderedItems as unknown) = undefined
    ;(window.onresize as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, override appState: AppState, appObservers: (() => void)[]) {
    super(application, appState)

    this.resetPagination()

    appObservers.push(
      application.streamItems<SNNote>(ContentType.Note, () => {
        void this.reloadItems()
      }),

      application.streamItems<SNTag>([ContentType.Tag], async ({ changed, inserted }) => {
        const tags = [...changed, ...inserted]

        /** A tag could have changed its relationships, so we need to reload the filter */
        this.reloadNotesDisplayOptions()

        void this.reloadItems()

        if (appState.tags.selected && findInArray(tags, 'uuid', appState.tags.selected.uuid)) {
          /** Tag title could have changed */
          this.reloadPanelTitle()
        }
      }),
      application.addEventObserver(async () => {
        void this.reloadPreferences()
      }, ApplicationEvent.PreferencesChanged),
      application.addEventObserver(async () => {
        this.application.noteControllerGroup.closeAllNoteControllers()
        void this.selectFirstItem()
        this.setCompletedFullSync(false)
      }, ApplicationEvent.SignedIn),
      application.addEventObserver(async () => {
        void this.reloadItems().then(() => {
          if (
            this.notes.length === 0 &&
            appState.tags.selected instanceof SmartView &&
            appState.tags.selected.uuid === SystemViewId.AllNotes &&
            this.noteFilterText === '' &&
            !this.getActiveNoteController()
          ) {
            this.createPlaceholderNote()?.catch(console.error)
          }
        })
        this.setCompletedFullSync(true)
      }, ApplicationEvent.CompletedFullSync),

      reaction(
        () => [
          appState.searchOptions.includeProtectedContents,
          appState.searchOptions.includeArchived,
          appState.searchOptions.includeTrashed,
        ],
        () => {
          this.reloadNotesDisplayOptions()
          void this.reloadItems()
        },
      ),

      appState.addObserver(async (eventName) => {
        if (eventName === AppStateEvent.TagChanged) {
          this.handleTagChange()
        } else if (eventName === AppStateEvent.ActiveEditorChanged) {
          this.handleEditorChange().catch(console.error)
        } else if (eventName === AppStateEvent.EditorFocused) {
          this.setShowDisplayOptionsMenu(false)
        }
      }),
    )

    makeObservable(this, {
      completedFullSync: observable,
      displayOptions: observable.struct,
      webDisplayOptions: observable.struct,
      noteFilterText: observable,
      notes: observable,
      notesToDisplay: observable,
      panelTitle: observable,
      renderedItems: observable,
      showDisplayOptionsMenu: observable,

      reloadItems: action,
      reloadPanelTitle: action,
      reloadPreferences: action,
      resetPagination: action,
      setCompletedFullSync: action,
      setNoteFilterText: action,
      setShowDisplayOptionsMenu: action,
      onFilterEnter: action,
      handleFilterTextChanged: action,

      optionsSubtitle: computed,
    })

    window.onresize = () => {
      this.resetPagination(true)
    }
  }

  public getActiveNoteController(): NoteViewController | undefined {
    return this.application.noteControllerGroup.activeNoteViewController
  }

  public get activeControllerNote(): SNNote | undefined {
    return this.getActiveNoteController()?.note
  }

  setCompletedFullSync = (completed: boolean) => {
    this.completedFullSync = completed
  }

  setShowDisplayOptionsMenu = (enabled: boolean) => {
    this.showDisplayOptionsMenu = enabled
  }

  get searchBarElement() {
    return document.getElementById(ELEMENT_ID_SEARCH_BAR)
  }

  get isFiltering(): boolean {
    return !!this.noteFilterText && this.noteFilterText.length > 0
  }

  reloadPanelTitle = () => {
    let title = this.panelTitle

    if (this.isFiltering) {
      const resultCount = this.notes.length
      title = `${resultCount} search results`
    } else if (this.appState.tags.selected) {
      title = `${this.appState.tags.selected.title}`
    }

    this.panelTitle = title
  }

  reloadItems = async (): Promise<void> => {
    if (this.reloadItemsPromise) {
      await this.reloadItemsPromise
    }

    this.reloadItemsPromise = this.performReloadItems()

    await this.reloadItemsPromise
  }

  private async performReloadItems() {
    const tag = this.appState.tags.selected
    if (!tag) {
      return
    }

    const notes = this.application.items.getDisplayableNotes()

    const items = this.application.items.getDisplayableNotesAndFiles()

    const renderedItems = items.slice(0, this.notesToDisplay)

    runInAction(() => {
      this.notes = notes
      this.items = items
      this.renderedItems = renderedItems
    })

    await this.recomputeSelectionAfterItemsReload()

    this.reloadPanelTitle()
  }

  private async recomputeSelectionAfterItemsReload() {
    const appState = this.appState
    const activeController = this.getActiveNoteController()
    const activeNote = activeController?.note
    const isSearching = this.noteFilterText.length > 0
    const hasMultipleItemsSelected = appState.selectedItems.selectedItemsCount >= 2

    if (hasMultipleItemsSelected) {
      return
    }

    const selectedItem = Object.values(appState.selectedItems.selectedItems)[0]

    if (this.items.includes(selectedItem) && selectedItem && selectedItem.content_type === ContentType.File) {
      return
    }

    if (!activeNote) {
      await this.selectFirstItem()

      return
    }

    if (activeController.isTemplateNote) {
      return
    }

    const noteExistsInUpdatedResults = this.notes.find((note) => note.uuid === activeNote.uuid)
    if (!noteExistsInUpdatedResults && !isSearching) {
      this.closeNoteController(activeController)

      this.selectNextItem()

      return
    }

    const showTrashedNotes =
      (appState.tags.selected instanceof SmartView && appState.tags.selected?.uuid === SystemViewId.TrashedNotes) ||
      appState?.searchOptions.includeTrashed

    const showArchivedNotes =
      (appState.tags.selected instanceof SmartView && appState.tags.selected.uuid === SystemViewId.ArchivedNotes) ||
      appState.searchOptions.includeArchived ||
      this.application.getPreference(PrefKey.NotesShowArchived, false)

    if ((activeNote.trashed && !showTrashedNotes) || (activeNote.archived && !showArchivedNotes)) {
      await this.selectNextItemOrCreateNewNote()
    } else if (!this.appState.selectedItems.selectedItems[activeNote.uuid]) {
      await this.appState.selectedItems.selectItem(activeNote.uuid).catch(console.error)
    }
  }

  reloadNotesDisplayOptions = () => {
    const tag = this.appState.tags.selected

    const searchText = this.noteFilterText.toLowerCase()
    const isSearching = searchText.length
    let includeArchived: boolean
    let includeTrashed: boolean

    if (isSearching) {
      includeArchived = this.appState.searchOptions.includeArchived
      includeTrashed = this.appState.searchOptions.includeTrashed
    } else {
      includeArchived = this.displayOptions.includeArchived ?? false
      includeTrashed = this.displayOptions.includeTrashed ?? false
    }

    const criteria: DisplayOptions = {
      sortBy: this.displayOptions.sortBy,
      sortDirection: this.displayOptions.sortDirection,
      tags: tag instanceof SNTag ? [tag] : [],
      views: tag instanceof SmartView ? [tag] : [],
      includeArchived,
      includeTrashed,
      includePinned: this.displayOptions.includePinned,
      includeProtected: this.displayOptions.includeProtected,
      searchQuery: {
        query: searchText,
        includeProtectedNoteText: this.appState.searchOptions.includeProtectedContents,
      },
    }

    this.application.items.setPrimaryItemDisplayOptions(criteria)
  }

  reloadPreferences = async () => {
    const newDisplayOptions = {} as DisplayOptions
    const newWebDisplayOptions = {} as WebDisplayOptions

    const currentSortBy = this.displayOptions.sortBy

    let sortBy = this.application.getPreference(PrefKey.SortNotesBy, CollectionSort.CreatedAt)
    if (sortBy === CollectionSort.UpdatedAt || (sortBy as string) === 'client_updated_at') {
      sortBy = CollectionSort.UpdatedAt
    }

    newDisplayOptions.sortBy = sortBy
    newDisplayOptions.sortDirection =
      this.application.getPreference(PrefKey.SortNotesReverse, false) === false ? 'dsc' : 'asc'
    newDisplayOptions.includeArchived = this.application.getPreference(PrefKey.NotesShowArchived, false)
    newDisplayOptions.includeTrashed = this.application.getPreference(PrefKey.NotesShowTrashed, false) as boolean
    newDisplayOptions.includePinned = !this.application.getPreference(PrefKey.NotesHidePinned, false)
    newDisplayOptions.includeProtected = !this.application.getPreference(PrefKey.NotesHideProtected, false)

    newWebDisplayOptions.hideNotePreview = this.application.getPreference(PrefKey.NotesHideNotePreview, false)
    newWebDisplayOptions.hideDate = this.application.getPreference(PrefKey.NotesHideDate, false)
    newWebDisplayOptions.hideTags = this.application.getPreference(PrefKey.NotesHideTags, true)
    newWebDisplayOptions.hideEditorIcon = this.application.getPreference(PrefKey.NotesHideEditorIcon, false)

    const displayOptionsChanged =
      newDisplayOptions.sortBy !== this.displayOptions.sortBy ||
      newDisplayOptions.sortDirection !== this.displayOptions.sortDirection ||
      newDisplayOptions.includePinned !== this.displayOptions.includePinned ||
      newDisplayOptions.includeArchived !== this.displayOptions.includeArchived ||
      newDisplayOptions.includeTrashed !== this.displayOptions.includeTrashed ||
      newDisplayOptions.includeProtected !== this.displayOptions.includeProtected ||
      newWebDisplayOptions.hideEditorIcon !== this.webDisplayOptions.hideEditorIcon ||
      newWebDisplayOptions.hideTags !== this.webDisplayOptions.hideTags

    this.displayOptions = newDisplayOptions

    if (displayOptionsChanged) {
      this.reloadNotesDisplayOptions()
    }

    await this.reloadItems()

    const width = this.application.getPreference(PrefKey.NotesPanelWidth)
    if (width) {
      this.panelWidth = width
    }

    if (newDisplayOptions.sortBy !== currentSortBy) {
      await this.selectFirstItem()
    }
  }

  createNewNote = async () => {
    this.appState.notes.unselectNotes()

    let title = `Note ${this.notes.length + 1}`
    if (this.isFiltering) {
      title = this.noteFilterText
    }

    await this.appState.notes.createNewNoteController(title)

    this.appState.noteTags.reloadTags()
  }

  createPlaceholderNote = () => {
    const selectedTag = this.appState.tags.selected
    if (selectedTag && selectedTag instanceof SmartView && selectedTag.uuid !== SystemViewId.AllNotes) {
      return
    }

    return this.createNewNote()
  }

  get optionsSubtitle(): string {
    let base = ''

    if (this.displayOptions.sortBy === CollectionSort.CreatedAt) {
      base += ' Date Added'
    } else if (this.displayOptions.sortBy === CollectionSort.UpdatedAt) {
      base += ' Date Modified'
    } else if (this.displayOptions.sortBy === CollectionSort.Title) {
      base += ' Title'
    }

    if (this.displayOptions.includeArchived) {
      base += ' | + Archived'
    }

    if (this.displayOptions.includeTrashed) {
      base += ' | + Trashed'
    }

    if (!this.displayOptions.includePinned) {
      base += ' | – Pinned'
    }

    if (!this.displayOptions.includeProtected) {
      base += ' | – Protected'
    }

    if (this.displayOptions.sortDirection === 'asc') {
      base += ' | Reversed'
    }

    return base
  }

  paginate = () => {
    this.notesToDisplay += this.pageSize

    void this.reloadItems()

    if (this.searchSubmitted) {
      this.application.getDesktopService()?.searchText(this.noteFilterText)
    }
  }

  resetPagination = (keepCurrentIfLarger = false) => {
    const clientHeight = document.documentElement.clientHeight
    this.pageSize = Math.ceil(clientHeight / MIN_NOTE_CELL_HEIGHT)
    if (this.pageSize === 0) {
      this.pageSize = DEFAULT_LIST_NUM_NOTES
    }
    if (keepCurrentIfLarger && this.notesToDisplay > this.pageSize) {
      return
    }
    this.notesToDisplay = this.pageSize
  }

  getFirstNonProtectedItem = () => {
    return this.items.find((item) => !item.protected)
  }

  get notesListScrollContainer() {
    return document.getElementById(ELEMENT_ID_SCROLL_CONTAINER)
  }

  selectItemWithScrollHandling = async (
    item: ListableContentItem,
    userTriggered?: boolean,
    scrollIntoView = true,
  ): Promise<void> => {
    await this.appState.selectedItems.selectItem(item.uuid, userTriggered)

    if (scrollIntoView) {
      const itemElement = document.getElementById(item.uuid)
      itemElement?.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }

  selectFirstItem = async () => {
    const item = this.getFirstNonProtectedItem()

    if (item) {
      await this.selectItemWithScrollHandling(item, false, false)

      this.resetScrollPosition()
    }
  }

  selectNextItem = () => {
    const displayableItems = this.items

    const currentIndex = displayableItems.findIndex((candidate) => {
      return candidate.uuid === this.appState.selectedItems.lastSelectedItem?.uuid
    })

    let nextIndex = currentIndex + 1

    while (nextIndex < displayableItems.length) {
      const nextItem = displayableItems[nextIndex]

      nextIndex++

      if (nextItem.protected) {
        continue
      }

      this.selectItemWithScrollHandling(nextItem, true).catch(console.error)

      const nextNoteElement = document.getElementById(nextItem.uuid)

      nextNoteElement?.focus()

      return
    }
  }

  selectNextItemOrCreateNewNote = async () => {
    const item = this.getFirstNonProtectedItem()

    if (item) {
      await this.selectItemWithScrollHandling(item, false, false).catch(console.error)
    } else {
      await this.createNewNote()
    }
  }

  selectPreviousItem = () => {
    const displayableItems = this.items

    if (!this.appState.selectedItems.lastSelectedItem) {
      return
    }

    const currentIndex = displayableItems.indexOf(this.appState.selectedItems.lastSelectedItem)

    let previousIndex = currentIndex - 1

    while (previousIndex >= 0) {
      const previousItem = displayableItems[previousIndex]

      previousIndex--

      if (previousItem.protected) {
        continue
      }

      this.selectItemWithScrollHandling(previousItem).catch(console.error)

      const previousNoteElement = document.getElementById(previousItem.uuid)

      previousNoteElement?.focus()

      return
    }
  }

  setNoteFilterText = (text: string) => {
    if (text === this.noteFilterText) {
      return
    }

    this.noteFilterText = text
    this.handleFilterTextChanged()
  }

  handleEditorChange = async () => {
    const activeNote = this.application.noteControllerGroup.activeNoteViewController?.note

    if (activeNote && activeNote.conflictOf) {
      this.application.mutator
        .changeAndSaveItem(activeNote, (mutator) => {
          mutator.conflictOf = undefined
        })
        .catch(console.error)
    }

    if (this.isFiltering) {
      this.application.getDesktopService()?.searchText(this.noteFilterText)
    }
  }

  resetScrollPosition = () => {
    if (this.notesListScrollContainer) {
      this.notesListScrollContainer.scrollTop = 0
      this.notesListScrollContainer.scrollLeft = 0
    }
  }

  private closeNoteController(controller: NoteViewController): void {
    this.application.noteControllerGroup.closeNoteController(controller)
  }

  handleTagChange = () => {
    const activeNoteController = this.getActiveNoteController()
    if (activeNoteController?.isTemplateNote) {
      this.closeNoteController(activeNoteController)
    }

    this.resetScrollPosition()

    this.setShowDisplayOptionsMenu(false)

    this.setNoteFilterText('')

    this.application.getDesktopService()?.searchText()

    this.resetPagination()

    this.reloadNotesDisplayOptions()

    void this.reloadItems()
  }

  onFilterEnter = () => {
    /**
     * For Desktop, performing a search right away causes
     * input to lose focus. We wait until user explicity hits
     * enter before highlighting desktop search results.
     */
    this.searchSubmitted = true

    this.application.getDesktopService()?.searchText(this.noteFilterText)
  }

  public async insertCurrentIfTemplate(): Promise<void> {
    const controller = this.getActiveNoteController()

    if (!controller) {
      return
    }

    if (controller.isTemplateNote) {
      await controller.insertTemplatedNote()
    }
  }

  handleFilterTextChanged = () => {
    if (this.searchSubmitted) {
      this.searchSubmitted = false
    }

    this.reloadNotesDisplayOptions()

    void this.reloadItems()
  }

  clearFilterText = () => {
    this.setNoteFilterText('')
    this.onFilterEnter()
    this.handleFilterTextChanged()
    this.resetPagination()
  }
}
