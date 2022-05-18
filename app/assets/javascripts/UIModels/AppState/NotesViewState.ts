import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  CollectionSort,
  CollectionSortProperty,
  ContentType,
  DeinitSource,
  findInArray,
  NotesDisplayCriteria,
  NoteViewController,
  PrefKey,
  SmartView,
  SNNote,
  SNTag,
  SystemViewId,
} from '@standardnotes/snjs'
import { action, computed, makeObservable, observable, reaction } from 'mobx'
import { AppState, AppStateEvent } from '.'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'

const MIN_NOTE_CELL_HEIGHT = 51.0
const DEFAULT_LIST_NUM_NOTES = 20
const ELEMENT_ID_SEARCH_BAR = 'search-bar'
const ELEMENT_ID_SCROLL_CONTAINER = 'notes-scrollable'

export type DisplayOptions = {
  sortBy: CollectionSortProperty
  sortReverse: boolean
  hidePinned: boolean
  showArchived: boolean
  showTrashed: boolean
  hideProtected: boolean
  hideTags: boolean
  hideNotePreview: boolean
  hideDate: boolean
  hideEditorIcon: boolean
}

export class NotesViewState extends AbstractState {
  completedFullSync = false
  noteFilterText = ''
  notes: SNNote[] = []
  notesToDisplay = 0
  pageSize = 0
  panelTitle = 'All Notes'
  panelWidth = 0
  renderedNotes: SNNote[] = []
  searchSubmitted = false
  showDisplayOptionsMenu = false
  displayOptions = {
    sortBy: CollectionSort.CreatedAt,
    sortReverse: false,
    hidePinned: false,
    showArchived: false,
    showTrashed: false,
    hideProtected: false,
    hideTags: true,
    hideDate: false,
    hideNotePreview: false,
    hideEditorIcon: false,
  }
  private reloadNotesPromise?: Promise<unknown>

  override deinit(source: DeinitSource) {
    super.deinit(source)
    ;(this.noteFilterText as unknown) = undefined
    ;(this.notes as unknown) = undefined
    ;(this.renderedNotes as unknown) = undefined
    ;(window.onresize as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, override appState: AppState, appObservers: (() => void)[]) {
    super(application, appState)

    this.resetPagination()

    appObservers.push(
      application.streamItems<SNNote>(ContentType.Note, () => {
        void this.reloadNotes()
      }),

      application.streamItems<SNTag>([ContentType.Tag], async ({ changed, inserted }) => {
        const tags = [...changed, ...inserted]

        /** A tag could have changed its relationships, so we need to reload the filter */
        this.reloadNotesDisplayOptions()

        void this.reloadNotes()

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
        void this.selectFirstNote()
        this.setCompletedFullSync(false)
      }, ApplicationEvent.SignedIn),
      application.addEventObserver(async () => {
        void this.reloadNotes().then(() => {
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
          void this.reloadNotes()
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
      noteFilterText: observable,
      notes: observable,
      notesToDisplay: observable,
      panelTitle: observable,
      renderedNotes: observable,
      showDisplayOptionsMenu: observable,

      reloadNotes: action,
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

  reloadNotes = async (): Promise<void> => {
    if (this.reloadNotesPromise) {
      await this.reloadNotesPromise
    }

    this.reloadNotesPromise = this.performReloadNotes()

    await this.reloadNotesPromise
  }

  private async performReloadNotes() {
    const tag = this.appState.tags.selected
    if (!tag) {
      return
    }

    const notes = this.application.items.getDisplayableNotes()

    const renderedNotes = notes.slice(0, this.notesToDisplay)

    this.notes = notes

    this.renderedNotes = renderedNotes

    await this.recomputeSelectionAfterNotesReload()

    this.reloadPanelTitle()
  }

  private async recomputeSelectionAfterNotesReload() {
    const appState = this.appState
    const activeController = this.getActiveNoteController()
    const activeNote = activeController?.note
    const isSearching = this.noteFilterText.length > 0
    const hasMultipleNotesSelected = appState.notes.selectedNotesCount >= 2

    if (hasMultipleNotesSelected) {
      return
    }

    if (!activeNote) {
      await this.selectFirstNote()

      return
    }

    if (activeController.isTemplateNote) {
      return
    }

    const noteExistsInUpdatedResults = this.notes.find((note) => note.uuid === activeNote.uuid)
    if (!noteExistsInUpdatedResults && !isSearching) {
      this.application.noteControllerGroup.closeNoteController(activeController)

      this.selectNextNote()

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
      await this.selectNextOrCreateNew()
    } else if (!this.appState.notes.selectedNotes[activeNote.uuid]) {
      await this.selectNoteWithScrollHandling(activeNote).catch(console.error)
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
      includeArchived = this.displayOptions.showArchived ?? false
      includeTrashed = this.displayOptions.showTrashed ?? false
    }

    const criteria = NotesDisplayCriteria.Create({
      sortProperty: this.displayOptions.sortBy,
      sortDirection: this.displayOptions.sortReverse ? 'asc' : 'dsc',
      tags: tag instanceof SNTag ? [tag] : [],
      views: tag instanceof SmartView ? [tag] : [],
      includeArchived,
      includeTrashed,
      includePinned: !this.displayOptions.hidePinned,
      includeProtected: !this.displayOptions.hideProtected,
      searchQuery: {
        query: searchText,
        includeProtectedNoteText: this.appState.searchOptions.includeProtectedContents,
      },
    })

    this.application.items.setNotesDisplayCriteria(criteria)
  }

  reloadPreferences = async () => {
    const freshDisplayOptions = {} as DisplayOptions
    const currentSortBy = this.displayOptions.sortBy
    let sortBy = this.application.getPreference(PrefKey.SortNotesBy, CollectionSort.CreatedAt)
    if (sortBy === CollectionSort.UpdatedAt || (sortBy as string) === 'client_updated_at') {
      /** Use UserUpdatedAt instead */
      sortBy = CollectionSort.UpdatedAt
    }
    freshDisplayOptions.sortBy = sortBy
    freshDisplayOptions.sortReverse = this.application.getPreference(PrefKey.SortNotesReverse, false)
    freshDisplayOptions.showArchived = this.application.getPreference(PrefKey.NotesShowArchived, false)
    freshDisplayOptions.showTrashed = this.application.getPreference(PrefKey.NotesShowTrashed, false) as boolean
    freshDisplayOptions.hidePinned = this.application.getPreference(PrefKey.NotesHidePinned, false)
    freshDisplayOptions.hideProtected = this.application.getPreference(PrefKey.NotesHideProtected, false)
    freshDisplayOptions.hideNotePreview = this.application.getPreference(PrefKey.NotesHideNotePreview, false)
    freshDisplayOptions.hideDate = this.application.getPreference(PrefKey.NotesHideDate, false)
    freshDisplayOptions.hideTags = this.application.getPreference(PrefKey.NotesHideTags, true)
    freshDisplayOptions.hideEditorIcon = this.application.getPreference(PrefKey.NotesHideEditorIcon, false)

    const displayOptionsChanged =
      freshDisplayOptions.sortBy !== this.displayOptions.sortBy ||
      freshDisplayOptions.sortReverse !== this.displayOptions.sortReverse ||
      freshDisplayOptions.hidePinned !== this.displayOptions.hidePinned ||
      freshDisplayOptions.showArchived !== this.displayOptions.showArchived ||
      freshDisplayOptions.showTrashed !== this.displayOptions.showTrashed ||
      freshDisplayOptions.hideProtected !== this.displayOptions.hideProtected ||
      freshDisplayOptions.hideEditorIcon !== this.displayOptions.hideEditorIcon ||
      freshDisplayOptions.hideTags !== this.displayOptions.hideTags

    this.displayOptions = freshDisplayOptions

    if (displayOptionsChanged) {
      this.reloadNotesDisplayOptions()
    }

    await this.reloadNotes()

    const width = this.application.getPreference(PrefKey.NotesPanelWidth)
    if (width) {
      this.panelWidth = width
    }

    if (freshDisplayOptions.sortBy !== currentSortBy) {
      await this.selectFirstNote()
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
    if (this.displayOptions.showArchived) {
      base += ' | + Archived'
    }
    if (this.displayOptions.showTrashed) {
      base += ' | + Trashed'
    }
    if (this.displayOptions.hidePinned) {
      base += ' | – Pinned'
    }
    if (this.displayOptions.hideProtected) {
      base += ' | – Protected'
    }
    if (this.displayOptions.sortReverse) {
      base += ' | Reversed'
    }
    return base
  }

  paginate = () => {
    this.notesToDisplay += this.pageSize

    void this.reloadNotes()

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

  getFirstNonProtectedNote = () => {
    return this.notes.find((note) => !note.protected)
  }

  get notesListScrollContainer() {
    return document.getElementById(ELEMENT_ID_SCROLL_CONTAINER)
  }

  selectNoteWithScrollHandling = async (
    note: SNNote,
    userTriggered?: boolean,
    scrollIntoView = true,
  ): Promise<void> => {
    await this.appState.notes.selectNote(note.uuid, userTriggered)

    if (scrollIntoView) {
      const noteElement = document.getElementById(`note-${note.uuid}`)
      noteElement?.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }

  selectFirstNote = async () => {
    const note = this.getFirstNonProtectedNote()

    if (note) {
      await this.selectNoteWithScrollHandling(note, false, false)

      this.resetScrollPosition()
    }
  }

  selectNextNote = () => {
    const displayableNotes = this.notes
    const currentIndex = displayableNotes.findIndex((candidate) => {
      return candidate.uuid === this.activeControllerNote?.uuid
    })

    if (currentIndex + 1 < displayableNotes.length) {
      const nextNote = displayableNotes[currentIndex + 1]

      this.selectNoteWithScrollHandling(nextNote).catch(console.error)

      const nextNoteElement = document.getElementById(`note-${nextNote.uuid}`)
      nextNoteElement?.focus()
    }
  }

  selectNextOrCreateNew = async () => {
    const note = this.getFirstNonProtectedNote()

    if (note) {
      await this.selectNoteWithScrollHandling(note, false, false).catch(console.error)
    } else {
      await this.createNewNote()
    }
  }

  selectPreviousNote = () => {
    const displayableNotes = this.notes

    if (this.activeControllerNote) {
      const currentIndex = displayableNotes.indexOf(this.activeControllerNote)
      if (currentIndex - 1 >= 0) {
        const previousNote = displayableNotes[currentIndex - 1]
        this.selectNoteWithScrollHandling(previousNote).catch(console.error)
        const previousNoteElement = document.getElementById(`note-${previousNote.uuid}`)
        previousNoteElement?.focus()
        return true
      } else {
        return false
      }
    }

    return undefined
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

  handleTagChange = () => {
    const activeNoteController = this.getActiveNoteController()
    if (activeNoteController?.isTemplateNote) {
      this.application.noteControllerGroup.closeNoteController(activeNoteController)
    }

    this.resetScrollPosition()

    this.setShowDisplayOptionsMenu(false)

    this.setNoteFilterText('')

    this.application.getDesktopService()?.searchText()

    this.resetPagination()

    this.reloadNotesDisplayOptions()

    void this.reloadNotes()
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
    void this.reloadNotes()
  }

  clearFilterText = () => {
    this.setNoteFilterText('')
    this.onFilterEnter()
    this.handleFilterTextChanged()
    this.resetPagination()
  }
}
