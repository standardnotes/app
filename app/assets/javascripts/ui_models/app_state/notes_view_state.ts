import {
  ApplicationEvent,
  CollectionSort,
  ContentType,
  NotesDisplayCriteria,
  PrefKey,
  SNNote,
  UuidString,
} from '@standardnotes/snjs';
import { action, autorun, computed, makeObservable, observable } from 'mobx';
import { AppState } from '.';
import { WebApplication } from '../application';

const MIN_NOTE_CELL_HEIGHT = 51.0;
const DEFAULT_LIST_NUM_NOTES = 20;

export type DisplayOptions = {
  sortBy: CollectionSort;
  sortReverse: boolean;
  hidePinned: boolean;
  showArchived: boolean;
  showTrashed: boolean;
  hideProtected: boolean;
  hideTags: boolean;
  hideNotePreview: boolean;
  hideDate: boolean;
};

export class NotesViewState {
  completedFullSync = false;
  noteFilterText = '';
  notes: SNNote[] = [];
  notesToDisplay = 0;
  pageSize = 0;
  panelTitle = 'All Notes';
  renderedNotes: SNNote[] = [];
  selectedNotes: Record<UuidString, SNNote> = {};
  showDisplayOptionsMenu = false;
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
  };

  constructor(
    private application: WebApplication,
    private appState: AppState,
    appObservers: (() => void)[]
  ) {
    this.resetPagination();

    autorun(() => {
      this.selectedNotes = this.appState.notes.selectedNotes;
    });

    appObservers.push(
      application.streamItems(ContentType.Note, () => {
        this.reloadNotes();
        const activeNote = this.appState.notes.activeEditor?.note;
        if (this.application.getAppState().notes.selectedNotesCount < 2) {
          if (activeNote) {
            const discarded = activeNote.deleted || activeNote.trashed;
            if (
              discarded &&
              !this.appState?.selectedTag?.isTrashTag &&
              !this.appState?.searchOptions.includeTrashed
            ) {
              this.selectNextOrCreateNew();
            } else if (!this.selectedNotes[activeNote.uuid]) {
              this.selectNote(activeNote);
            }
          } else {
            this.selectFirstNote();
          }
        }
      }),
      application.addEventObserver(async () => {
        this.reloadPreferences();
      }, ApplicationEvent.PreferencesChanged)
    );

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
      setNoteFilterText: action,
      toggleDisplayOptionsMenu: action,

      optionsSubtitle: computed,
    });

    window.onresize = () => {
      this.resetPagination(true);
    };
  }

  toggleDisplayOptionsMenu = (enabled: boolean) => {
    this.showDisplayOptionsMenu = enabled;
  };

  get isFiltering(): boolean {
    return !!this.noteFilterText && this.noteFilterText.length > 0;
  }

  reloadPanelTitle = () => {
    let title = this.panelTitle;
    if (this.isFiltering) {
      const resultCount = this.notes.length;
      title = `${resultCount} search results`;
    } else if (this.appState.selectedTag) {
      title = `${this.appState.selectedTag.title}`;
    }
    this.panelTitle = title;
  };

  reloadNotes = () => {
    const tag = this.appState.selectedTag;
    if (!tag) {
      return;
    }
    const notes = this.application.getDisplayableItems(
      ContentType.Note
    ) as SNNote[];
    const renderedNotes = notes.slice(0, this.notesToDisplay);

    this.notes = notes;
    this.renderedNotes = renderedNotes;
    this.reloadPanelTitle();
  };

  reloadNotesDisplayOptions = () => {
    const tag = this.appState.selectedTag;

    const searchText = this.noteFilterText.toLowerCase();
    const isSearching = searchText.length;
    let includeArchived: boolean;
    let includeTrashed: boolean;

    if (isSearching) {
      includeArchived = this.appState.searchOptions.includeArchived;
      includeTrashed = this.appState.searchOptions.includeTrashed;
    } else {
      includeArchived = this.displayOptions.showArchived ?? false;
      includeTrashed = this.displayOptions.showTrashed ?? false;
    }

    const criteria = NotesDisplayCriteria.Create({
      sortProperty: this.displayOptions.sortBy as CollectionSort,
      sortDirection: this.displayOptions.sortReverse ? 'asc' : 'dsc',
      tags: tag ? [tag] : [],
      includeArchived,
      includeTrashed,
      includePinned: !this.displayOptions.hidePinned,
      includeProtected: !this.displayOptions.hideProtected,
      searchQuery: {
        query: searchText,
        includeProtectedNoteText:
          this.appState.searchOptions.includeProtectedContents,
      },
    });
    this.application.setNotesDisplayCriteria(criteria);
  };

  reloadPreferences = () => {
    const freshDisplayOptions = {} as DisplayOptions;
    let sortBy = this.application.getPreference(
      PrefKey.SortNotesBy,
      CollectionSort.CreatedAt
    );
    if (
      sortBy === CollectionSort.UpdatedAt ||
      (sortBy as string) === 'client_updated_at'
    ) {
      /** Use UserUpdatedAt instead */
      sortBy = CollectionSort.UpdatedAt;
    }
    freshDisplayOptions.sortBy = sortBy;
    freshDisplayOptions.sortReverse = this.application.getPreference(
      PrefKey.SortNotesReverse,
      false
    );
    freshDisplayOptions.showArchived = this.application.getPreference(
      PrefKey.NotesShowArchived,
      false
    );
    freshDisplayOptions.showTrashed = this.application.getPreference(
      PrefKey.NotesShowTrashed,
      false
    ) as boolean;
    freshDisplayOptions.hidePinned = this.application.getPreference(
      PrefKey.NotesHidePinned,
      false
    );
    freshDisplayOptions.hideProtected = this.application.getPreference(
      PrefKey.NotesHideProtected,
      false
    );
    freshDisplayOptions.hideNotePreview = this.application.getPreference(
      PrefKey.NotesHideNotePreview,
      false
    );
    freshDisplayOptions.hideDate = this.application.getPreference(
      PrefKey.NotesHideDate,
      false
    );
    freshDisplayOptions.hideTags = this.application.getPreference(
      PrefKey.NotesHideTags,
      true
    );
    const displayOptionsChanged =
      freshDisplayOptions.sortBy !== this.displayOptions.sortBy ||
      freshDisplayOptions.sortReverse !== this.displayOptions.sortReverse ||
      freshDisplayOptions.hidePinned !== this.displayOptions.hidePinned ||
      freshDisplayOptions.showArchived !== this.displayOptions.showArchived ||
      freshDisplayOptions.showTrashed !== this.displayOptions.showTrashed ||
      freshDisplayOptions.hideProtected !== this.displayOptions.hideProtected ||
      freshDisplayOptions.hideTags !== this.displayOptions.hideTags;
    this.displayOptions = freshDisplayOptions;
    if (displayOptionsChanged) {
      this.reloadNotesDisplayOptions();
    }
    this.reloadNotes();
  };

  createNewNote = async (focusNewNote = true) => {
    this.appState.notes.unselectNotes();
    let title = `Note ${this.notes.length + 1}`;
    if (this.isFiltering) {
      title = this.noteFilterText;
    }
    await this.appState.createEditor(title);
    this.reloadNotes();
    this.appState.noteTags.reloadTags();
    const noteTitleEditorElement = document.getElementById('note-title-editor');
    if (focusNewNote) {
      noteTitleEditorElement?.focus();
    }
  };

  get optionsSubtitle(): string {
    let base = '';
    if (this.displayOptions.sortBy === CollectionSort.CreatedAt) {
      base += ' Date Added';
    } else if (this.displayOptions.sortBy === CollectionSort.UpdatedAt) {
      base += ' Date Modified';
    } else if (this.displayOptions.sortBy === CollectionSort.Title) {
      base += ' Title';
    }
    if (this.displayOptions.showArchived) {
      base += ' | + Archived';
    }
    if (this.displayOptions.showTrashed) {
      base += ' | + Trashed';
    }
    if (this.displayOptions.hidePinned) {
      base += ' | – Pinned';
    }
    if (this.displayOptions.hideProtected) {
      base += ' | – Protected';
    }
    if (this.displayOptions.sortReverse) {
      base += ' | Reversed';
    }
    return base;
  }

  resetPagination = (keepCurrentIfLarger = false) => {
    const clientHeight = document.documentElement.clientHeight;
    this.pageSize = Math.ceil(clientHeight / MIN_NOTE_CELL_HEIGHT);
    if (this.pageSize === 0) {
      this.pageSize = DEFAULT_LIST_NUM_NOTES;
    }
    if (keepCurrentIfLarger && this.notesToDisplay > this.pageSize) {
      return;
    }
    this.notesToDisplay = this.pageSize;
  };

  getFirstNonProtectedNote = () => {
    return this.notes.find((note) => !note.protected);
  };

  selectFirstNote = () => {
    const note = this.getFirstNonProtectedNote();
    if (note) {
      this.selectNote(note);
    }
  };

  selectNote = async (note: SNNote, userTriggered?: boolean): Promise<void> => {
    await this.appState.notes.selectNote(note.uuid, userTriggered);
  };

  selectNextOrCreateNew = () => {
    const note = this.getFirstNonProtectedNote();
    if (note) {
      this.selectNote(note);
    } else {
      this.appState.closeActiveEditor();
    }
  };

  setNoteFilterText = (text: string) => {
    this.noteFilterText = text;
  };
}
