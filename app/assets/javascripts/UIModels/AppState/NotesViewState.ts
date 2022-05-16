import { destroyAllObjectProperties } from '@/Utils'
import {
  ApplicationEvent,
  CollectionSort,
  CollectionSortProperty,
  ContentType,
  DeinitSource,
  findInArray,
  NotesDisplayCriteria,
  PrefKey,
  SmartView,
  SNNote,
  SNTag,
  SystemViewId,
  UuidString,
} from '@standardnotes/snjs'
import { action, autorun, computed, makeObservable, observable, reaction } from 'mobx'
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
  selectedNotes: Record<UuidString, SNNote> = {}
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

  override deinit(source: DeinitSource) {
    super.deinit(source)
    ;(this.noteFilterText as unknown) = undefined
    ;(this.notes as unknown) = undefined
    ;(this.renderedNotes as unknown) = undefined
    ;(this.selectedNotes as unknown) = undefined
    ;(window.onresize as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, override appState: AppState, appObservers: (() => void)[]) {
    super(application, appState)

    this.resetPagination()

    appObservers.push(
      application.streamItems<SNNote>(ContentType.Note, () => {
        this.reloadNotes()

        const activeNote = appState.notes.activeNoteController?.note

        if (appState.notes.selectedNotesCount < 2) {
          if (activeNote) {
            const browsingTrashedNotes =
              appState.selectedTag instanceof SmartView && appState.selectedTag?.uuid === SystemViewId.TrashedNotes

            if (activeNote.trashed && !browsingTrashedNotes && !appState?.searchOptions.includeTrashed) {
              this.selectNextOrCreateNew()
            } else if (!this.selectedNotes[activeNote.uuid]) {
              this.selectNote(activeNote).catch(console.error)
            }
          } else {
            this.selectFirstNote()
          }
        }
      }),

      application.streamItems<SNTag>([ContentType.Tag], async ({ changed, inserted }) => {
        const tags = [...changed, ...inserted]
        /** A tag could have changed its relationships, so we need to reload the filter */
        this.reloadNotesDisplayOptions()
        this.reloadNotes()

        if (appState.selectedTag && findInArray(tags, 'uuid', appState.selectedTag.uuid)) {
          /** Tag title could have changed */
          this.reloadPanelTitle()
        }
      }),
      application.addEventObserver(async () => {
        this.reloadPreferences()
      }, ApplicationEvent.PreferencesChanged),
      application.addEventObserver(async () => {
        appState.closeAllNoteControllers()
        this.selectFirstNote()
        this.setCompletedFullSync(false)
      }, ApplicationEvent.SignedIn),
      application.addEventObserver(async () => {
        this.reloadNotes()
        if (
          this.notes.length === 0 &&
          appState.selectedTag instanceof SmartView &&
          appState.selectedTag.uuid === SystemViewId.AllNotes &&
          this.noteFilterText === '' &&
          !appState.notes.activeNoteController
        ) {
          this.createPlaceholderNote()?.catch(console.error)
        }
        this.setCompletedFullSync(true)
      }, ApplicationEvent.CompletedFullSync),

      autorun(() => {
        if (appState.notes.selectedNotes) {
          this.syncSelectedNotes()
        }
      }),

      reaction(
        () => [
          appState.searchOptions.includeProtectedContents,
          appState.searchOptions.includeArchived,
          appState.searchOptions.includeTrashed,
        ],
        () => {
          this.reloadNotesDisplayOptions()
          this.reloadNotes()
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
      selectedNotes: observable,
      showDisplayOptionsMenu: observable,

      reloadNotes: action,
      reloadPanelTitle: action,
      reloadPreferences: action,
      resetPagination: action,
      setCompletedFullSync: action,
      setNoteFilterText: action,
      syncSelectedNotes: action,
      setShowDisplayOptionsMenu: action,
      onFilterEnter: action,
      handleFilterTextChanged: action,

      optionsSubtitle: computed,
    })

    window.onresize = () => {
      this.resetPagination(true)
    }
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

  get activeEditorNote() {
    return this.appState.notes.activeNoteController?.note
  }

  reloadPanelTitle = () => {
    let title = this.panelTitle
    if (this.isFiltering) {
      const resultCount = this.notes.length
      title = `${resultCount} search results`
    } else if (this.appState.selectedTag) {
      title = `${this.appState.selectedTag.title}`
    }
    this.panelTitle = title
  }

  reloadNotes = () => {
    const tag = this.appState.selectedTag
    if (!tag) {
      return
    }
    const notes = this.application.items.getDisplayableNotes()
    const renderedNotes = notes.slice(0, this.notesToDisplay)

    this.notes = notes
    this.renderedNotes = renderedNotes
    this.reloadPanelTitle()
  }

  reloadNotesDisplayOptions = () => {
    const tag = this.appState.selectedTag

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

  reloadPreferences = () => {
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

    this.reloadNotes()

    const width = this.application.getPreference(PrefKey.NotesPanelWidth)
    if (width) {
      this.panelWidth = width
    }

    if (freshDisplayOptions.sortBy !== currentSortBy) {
      this.selectFirstNote()
    }
  }

  createNewNote = async () => {
    this.appState.notes.unselectNotes()
    let title = `Note ${this.notes.length + 1}`
    if (this.isFiltering) {
      title = this.noteFilterText
    }

    await this.appState.openNewNote(title)

    this.reloadNotes()
    this.appState.noteTags.reloadTags()
  }

  createPlaceholderNote = () => {
    const selectedTag = this.appState.selectedTag
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
    this.reloadNotes()

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

  selectNote = async (note: SNNote, userTriggered?: boolean, scrollIntoView = true): Promise<void> => {
    await this.appState.notes.selectNote(note.uuid, userTriggered)
    if (scrollIntoView) {
      const noteElement = document.getElementById(`note-${note.uuid}`)
      noteElement?.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }

  selectFirstNote = () => {
    const note = this.getFirstNonProtectedNote()
    if (note) {
      this.selectNote(note, false, false).catch(console.error)
      this.resetScrollPosition()
    }
  }

  selectNextNote = () => {
    const displayableNotes = this.notes
    const currentIndex = displayableNotes.findIndex((candidate) => {
      return candidate.uuid === this.activeEditorNote?.uuid
    })
    if (currentIndex + 1 < displayableNotes.length) {
      const nextNote = displayableNotes[currentIndex + 1]
      this.selectNote(nextNote).catch(console.error)
      const nextNoteElement = document.getElementById(`note-${nextNote.uuid}`)
      nextNoteElement?.focus()
    }
  }

  selectNextOrCreateNew = () => {
    const note = this.getFirstNonProtectedNote()
    if (note) {
      this.selectNote(note, false, false).catch(console.error)
    } else {
      this.appState.closeActiveNoteController()
    }
  }

  selectPreviousNote = () => {
    const displayableNotes = this.notes

    if (this.activeEditorNote) {
      const currentIndex = displayableNotes.indexOf(this.activeEditorNote)
      if (currentIndex - 1 >= 0) {
        const previousNote = displayableNotes[currentIndex - 1]
        this.selectNote(previousNote).catch(console.error)
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
    this.noteFilterText = text
    this.handleFilterTextChanged()
  }

  syncSelectedNotes = () => {
    this.selectedNotes = this.appState.notes.selectedNotes
  }

  handleEditorChange = async () => {
    const activeNote = this.appState.getActiveNoteController()?.note
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
    this.resetScrollPosition()

    this.setShowDisplayOptionsMenu(false)

    this.setNoteFilterText('')

    this.application.getDesktopService()?.searchText()

    this.resetPagination()

    /* Capture db load state before beginning reloadNotes,
      since this status may change during reload */
    const dbLoaded = this.application.isDatabaseLoaded()
    this.reloadNotesDisplayOptions()
    this.reloadNotes()

    const hasSomeNotes = this.notes.length > 0

    if (hasSomeNotes) {
      this.selectFirstNote()
    } else if (dbLoaded) {
      if (this.activeEditorNote && !this.notes.includes(this.activeEditorNote)) {
        this.appState.closeActiveNoteController()
      }
    }
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

  handleFilterTextChanged = () => {
    if (this.searchSubmitted) {
      this.searchSubmitted = false
    }
    this.reloadNotesDisplayOptions()
    this.reloadNotes()
  }

  clearFilterText = () => {
    this.setNoteFilterText('')
    this.onFilterEnter()
    this.handleFilterTextChanged()
    this.resetPagination()
  }
}
