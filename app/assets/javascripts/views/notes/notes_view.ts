import { PanelPuppet, WebDirective } from './../../types';
import template from './notes-view.pug';
import {
  ApplicationEvent,
  ContentType,
  removeFromArray,
  SNNote,
  SNTag,
  WebPrefKey,
  findInArray,
  CollectionSort,
} from 'snjs';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { AppStateEvent } from '@/ui_models/app_state';
import { KeyboardModifier, KeyboardKey } from '@/services/keyboardManager';
import {
  PANEL_NAME_NOTES
} from '@/views/constants';
import {
  NoteSortKey,
  notePassesFilter
} from './note_utils';
import { UuidString } from 'snjs/dist/@types/types';

type NotesState = {
  panelTitle: string
  notes?: SNNote[]
  renderedNotes: SNNote[]
  sortBy?: string
  sortReverse?: boolean
  showArchived?: boolean
  hidePinned?: boolean
  hideNotePreview?: boolean
  hideDate?: boolean
  noteFilter: { text: string }
  mutable: { showMenu: boolean }
  localDataLoaded: boolean
  [WebPrefKey.TagsPanelWidth]?: number
  [WebPrefKey.NotesPanelWidth]?: number
  [WebPrefKey.EditorWidth]?: number
  [WebPrefKey.EditorLeft]?: number
  [WebPrefKey.EditorMonospaceEnabled]?: boolean
  [WebPrefKey.EditorSpellcheck]?: boolean
  [WebPrefKey.EditorResizersEnabled]?: boolean
}

type NoteFlag = {
  text: string
  class: 'info' | 'neutral' | 'warning' | 'success' | 'danger'
}

/**
 * This is the height of a note cell with nothing but the title,
 * which *is* a display option
 */
const MIN_NOTE_CELL_HEIGHT = 51.0;
const DEFAULT_LIST_NUM_NOTES = 20;
const ELEMENT_ID_SEARCH_BAR = 'search-bar';
const ELEMENT_ID_SCROLL_CONTAINER = 'notes-scrollable';

class NotesViewCtrl extends PureViewCtrl<{}, NotesState> {

  private panelPuppet?: PanelPuppet
  private reloadNotesPromise?: any
  private notesToDisplay = 0
  private pageSize = 0
  private searchSubmitted = false
  private newNoteKeyObserver: any
  private nextNoteKeyObserver: any
  private previousNoteKeyObserver: any
  private searchKeyObserver: any
  private noteFlags: Partial<Record<UuidString, NoteFlag[]>> = {}
  private removeObservers: Array<() => void> = [];

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService, ) {
    super($timeout);
    this.resetPagination();
  }

  $onInit() {
    super.$onInit();
    this.panelPuppet = {
      onReady: () => this.reloadPanelWidth()
    };
    this.onWindowResize = this.onWindowResize.bind(this);
    this.onPanelResize = this.onPanelResize.bind(this);
    window.addEventListener('resize', this.onWindowResize, true);
    this.registerKeyboardShortcuts();
  }

  onWindowResize() {
    this.resetPagination(true);
  }

  deinit() {
    for (const remove of this.removeObservers) remove();
    this.removeObservers.length = 0;
    this.panelPuppet!.onReady = undefined;
    this.panelPuppet = undefined;
    window.removeEventListener('resize', this.onWindowResize, true);
    (this.onWindowResize as any) = undefined;
    (this.onPanelResize as any) = undefined;
    this.newNoteKeyObserver();
    this.nextNoteKeyObserver();
    this.previousNoteKeyObserver();
    this.searchKeyObserver();
    this.newNoteKeyObserver = undefined;
    this.nextNoteKeyObserver = undefined;
    this.previousNoteKeyObserver = undefined;
    this.searchKeyObserver = undefined;
    super.deinit();
  }

  getState() {
    return this.state as NotesState;
  }

  async setNotesState(state: Partial<NotesState>) {
    return this.setState(state);
  }

  getInitialState(): NotesState {
    return {
      notes: [],
      renderedNotes: [],
      mutable: { showMenu: false },
      noteFilter: { text: '' },
      panelTitle: '',
      localDataLoaded: false,
    };
  }

  async onAppLaunch() {
    super.onAppLaunch();
    this.streamNotesAndTags();
    this.reloadPreferences();
  }

  /** @override */
  onAppStateEvent(eventName: AppStateEvent, data?: any) {
    if (eventName === AppStateEvent.TagChanged) {
      this.handleTagChange(
        this.application!.getAppState().getSelectedTag()!
      );
    } else if (eventName === AppStateEvent.ActiveEditorChanged) {
      this.handleEditorChange();
    } else if (eventName === AppStateEvent.PreferencesChanged) {
      this.reloadPreferences();
    } else if (eventName === AppStateEvent.EditorFocused) {
      this.setShowMenuFalse();
    }
  }

  /** @template */
  public get activeEditorNote() {
    return this.appState?.getActiveEditor()?.note;
  }

  public get editorNotes() {
    return this.appState.getEditors().map((editor) => editor.note);
  }

  /** @override */
  async onAppEvent(eventName: ApplicationEvent) {
    switch (eventName) {
      case ApplicationEvent.SignedIn:
        this.appState.closeAllEditors();
        this.selectFirstNote();
        break;
      case ApplicationEvent.CompletedFullSync:
        this.getMostValidNotes().then((notes) => {
          if (notes.length === 0) {
            this.createPlaceholderNote();
          }
        });
        break;
      case ApplicationEvent.LocalDataLoaded:
        this.setState({
          localDataLoaded: true,
        });
        break;
    }
  }

  /**
   * Access the current state notes without awaiting any potential reloads
   * that may be in progress. This is the sync alternative to `async getMostValidNotes`
   */
  private getPossiblyStaleNotes() {
    return this.getState().notes!;
  }

  /**
   * Access the current state notes after waiting for any pending reloads.
   * This returns the most up to date notes, but is the asyncronous counterpart
   * to `getPossiblyStaleNotes`
   */
  private async getMostValidNotes() {
    await this.reloadNotesPromise;
    return this.getPossiblyStaleNotes();
  }

  /**
   * Triggered programatically to create a new placeholder note
   * when conditions allow for it. This is as opposed to creating a new note
   * as part of user interaction (pressing the + button).
   */
  private async createPlaceholderNote() {
    const selectedTag = this.application!.getAppState().getSelectedTag()!;
    if (selectedTag.isSmartTag() && !selectedTag.isAllTag) {
      return;
    }
    return this.createNewNote();
  }

  streamNotesAndTags() {
    this.removeObservers.push(this.application!.streamItems(
      [ContentType.Note],
      async (items) => {
        const notes = items as SNNote[];
        /** Note has changed values, reset its flags */
        for (const note of notes) {
          if (note.deleted) {
            continue;
          }
          this.loadFlagsForNote(note);
        }
        /** If a note changes, it will be queried against the existing filter;
         * we dont need to reload display options */
        await this.reloadNotes();
        const activeNote = this.activeEditorNote;
        if (activeNote) {
          const discarded = activeNote.deleted || activeNote.trashed;
          if (discarded) {
            this.selectNextOrCreateNew();
          }
        } else {
          this.selectFirstNote();
        }
      }
    ));

    this.removeObservers.push(this.application!.streamItems(
      [ContentType.Tag],
      async (items) => {
        const tags = items as SNTag[];
        /** A tag could have changed its relationships, so we need to reload the filter */
        this.reloadNotesDisplayOptions();
        await this.reloadNotes();
        if (findInArray(tags, 'uuid', this.appState.selectedTag?.uuid)) {
          /** Tag title could have changed */
          this.reloadPanelTitle();
        }
      }
    ));
  }

  async selectNote(note: SNNote) {
    await this.appState.openEditor(note.uuid);
    this.reloadNotes();
  }

  async createNewNote() {
    let title = `Note ${this.getState().notes!.length + 1}`;
    if (this.isFiltering()) {
      title = this.getState().noteFilter.text;
    }
    await this.appState.createEditor(title);
    await this.flushUI();
    await this.reloadNotes();
  }

  async handleTagChange(tag: SNTag) {
    this.resetScrollPosition();
    this.setShowMenuFalse();
    await this.setNoteFilterText('');
    this.application!.getDesktopService().searchText();
    this.resetPagination();

    /* Capture db load state before beginning reloadNotes,
      since this status may change during reload */
    const dbLoaded = this.application!.isDatabaseLoaded();
    this.reloadNotesDisplayOptions();
    await this.reloadNotes();

    if (this.getState().notes!.length > 0) {
      this.selectFirstNote();
    } else if (dbLoaded) {
      if (!tag.isSmartTag() || tag.isAllTag) {
        this.createPlaceholderNote();
      } else if (
        this.activeEditorNote &&
        !this.getState().notes!.includes(this.activeEditorNote!)
      ) {
        this.appState.closeActiveEditor();
      }
    }
  }

  resetScrollPosition() {
    const scrollable = document.getElementById(ELEMENT_ID_SCROLL_CONTAINER);
    if (scrollable) {
      scrollable.scrollTop = 0;
      scrollable.scrollLeft = 0;
    }
  }

  async removeNoteFromList(note: SNNote) {
    const notes = this.getState().notes!;
    removeFromArray(notes, note);
    await this.setNotesState({
      notes: notes,
      renderedNotes: notes.slice(0, this.notesToDisplay)
    });
  }

  private async reloadNotes() {
    this.reloadNotesPromise = this.performReloadNotes();
    return this.reloadNotesPromise;
  }

  /**
   * Note that reloading display options destroys the current index and rebuilds it,
   * so call sparingly. The runtime complexity of destroying and building
   * an index is roughly O(n^2).
   */
  private reloadNotesDisplayOptions() {
    const tag = this.appState.selectedTag!;
    this.application!.setNotesDisplayOptions(
      tag,
      this.state.sortBy! as CollectionSort,
      this.state.sortReverse! ? 'asc' : 'dsc',
      (note: SNNote) => {
        return notePassesFilter(
          note,
          this.getState().showArchived!,
          this.getState().hidePinned!,
          this.getState().noteFilter.text.toLowerCase()
        );
      }
    );
  }

  currentTagCanHavePlaceholderNotes() {
    const selectedTag = this.application!.getAppState().getSelectedTag()!;
    return selectedTag.isAllTag || !selectedTag.isSmartTag()
  }

  private async performReloadNotes() {
    const tag = this.appState.selectedTag!;
    if (!tag) {
      return;
    }
    const notes = this.application.getDisplayableItems(ContentType.Note) as SNNote[];
    let renderedNotes: SNNote[];
    if (
      this.appState.getActiveEditor()?.isTemplateNote &&
      this.currentTagCanHavePlaceholderNotes()
    ) {
      renderedNotes = [this.appState.getActiveEditor().note, ...notes.slice(0, this.notesToDisplay)];
    } else {
      renderedNotes = notes.slice(0, this.notesToDisplay);
    }
    await this.setNotesState({
      notes,
      renderedNotes,
    });
    this.reloadPanelTitle();
  }

  setShowMenuFalse() {
    this.setNotesState({
      mutable: {
        ...this.getState().mutable,
        showMenu: false
      }
    });
  }

  async handleEditorChange() {
    const activeNote = this.appState.getActiveEditor().note;
    if (activeNote && activeNote.conflictOf) {
      this.application!.changeAndSaveItem(activeNote.uuid, (mutator) => {
        mutator.conflictOf = undefined;
      })
    }
    if (this.isFiltering()) {
      this.application!.getDesktopService().searchText(this.getState().noteFilter.text);
    }
  }

  async reloadPreferences() {
    const viewOptions = {} as NotesState;
    const prevSortValue = this.getState().sortBy;
    let sortBy = this.application!.getPrefsService().getValue(
      WebPrefKey.SortNotesBy,
      NoteSortKey.CreatedAt
    );
    if (sortBy === NoteSortKey.UpdatedAt || sortBy === NoteSortKey.ClientUpdatedAt) {
      /** Use UserUpdatedAt instead */
      sortBy = NoteSortKey.UserUpdatedAt;
    }
    viewOptions.sortBy = sortBy;
    viewOptions.sortReverse = this.application!.getPrefsService().getValue(
      WebPrefKey.SortNotesReverse,
      false
    );
    viewOptions.showArchived = this.application!.getPrefsService().getValue(
      WebPrefKey.NotesShowArchived,
      false
    );
    viewOptions.hidePinned = this.application!.getPrefsService().getValue(
      WebPrefKey.NotesHidePinned,
      false
    );
    viewOptions.hideNotePreview = this.application!.getPrefsService().getValue(
      WebPrefKey.NotesHideNotePreview,
      false
    );
    viewOptions.hideDate = this.application!.getPrefsService().getValue(
      WebPrefKey.NotesHideDate,
      false
    );
    const state = this.getState();
    const displayOptionsChanged = (
      viewOptions.sortBy !== state.sortBy ||
      viewOptions.sortReverse !== state.sortReverse ||
      viewOptions.hidePinned !== state.hidePinned ||
      viewOptions.showArchived !== state.showArchived
    );
    await this.setNotesState({
      ...viewOptions
    });
    this.reloadPanelWidth();
    if (displayOptionsChanged) {
      this.reloadNotesDisplayOptions();
    }
    await this.reloadNotes();
    if (prevSortValue && prevSortValue !== sortBy) {
      this.selectFirstNote();
    }
  }

  reloadPanelWidth() {
    const width = this.application!.getPrefsService().getValue(
      WebPrefKey.NotesPanelWidth
    );
    if (width && this.panelPuppet!.ready) {
      this.panelPuppet!.setWidth!(width);
      if (this.panelPuppet!.isCollapsed!()) {
        this.application!.getAppState().panelDidResize(
          PANEL_NAME_NOTES,
          this.panelPuppet!.isCollapsed!()
        );
      }
    }
  }

  onPanelResize(
    newWidth: number,
    _: number,
    __: boolean,
    isCollapsed: boolean
  ) {
    this.application!.getPrefsService().setUserPrefValue(
      WebPrefKey.NotesPanelWidth,
      newWidth,
      true
    );
    this.application!.getAppState().panelDidResize(
      PANEL_NAME_NOTES,
      isCollapsed
    );
  }

  paginate() {
    this.notesToDisplay += this.pageSize;
    this.reloadNotes();
    if (this.searchSubmitted) {
      this.application!.getDesktopService().searchText(this.getState().noteFilter.text);
    }
  }

  resetPagination(keepCurrentIfLarger = false) {
    const clientHeight = document.documentElement.clientHeight;
    this.pageSize = Math.ceil(clientHeight / MIN_NOTE_CELL_HEIGHT);
    if (this.pageSize === 0) {
      this.pageSize = DEFAULT_LIST_NUM_NOTES;
    }
    if (keepCurrentIfLarger && this.notesToDisplay > this.pageSize) {
      return;
    }
    this.notesToDisplay = this.pageSize;
  }

  reloadPanelTitle() {
    let title;
    if (this.isFiltering()) {
      const resultCount = this.getState().notes!.length;
      title = `${resultCount} search results`;
    } else if (this.appState.selectedTag) {
      title = `${this.appState.selectedTag.title}`;
    }
    this.setNotesState({
      panelTitle: title
    });
  }

  optionsSubtitle() {
    let base = "";
    if (this.getState().sortBy === NoteSortKey.CreatedAt) {
      base += " Date Added";
    } else if (this.getState().sortBy === NoteSortKey.UserUpdatedAt) {
      base += " Date Modified";
    } else if (this.getState().sortBy === NoteSortKey.Title) {
      base += " Title";
    }
    if (this.getState().showArchived) {
      base += " | + Archived";
    }
    if (this.getState().hidePinned) {
      base += " | – Pinned";
    }
    if (this.getState().sortReverse) {
      base += " | Reversed";
    }
    return base;
  }

  loadFlagsForNote(note: SNNote) {
    const flags = [] as NoteFlag[];
    if (note.pinned) {
      flags.push({
        text: "Pinned",
        class: 'info'
      });
    }
    if (note.archived) {
      flags.push({
        text: "Archived",
        class: 'warning'
      });
    }
    if (note.protected) {
      flags.push({
        text: "Protected",
        class: 'success'
      });
    }
    if (note.locked) {
      flags.push({
        text: "Locked",
        class: 'neutral'
      });
    }
    if (note.trashed) {
      flags.push({
        text: "Deleted",
        class: 'danger'
      });
    }
    if (note.conflictOf) {
      flags.push({
        text: "Conflicted Copy",
        class: 'danger'
      });
    }
    if (note.errorDecrypting) {
      if (note.waitingForKey) {
        flags.push({
          text: "Waiting For Keys",
          class: 'info'
        });
      } else {
        flags.push({
          text: "Missing Keys",
          class: 'danger'
        });
      }
    }
    if (note.deleted) {
      flags.push({
        text: "Deletion Pending Sync",
        class: 'danger'
      });
    }
    this.noteFlags[note.uuid] = flags;
  }

  displayableNotes() {
    return this.getState().notes!;
  }

  getFirstNonProtectedNote() {
    const displayableNotes = this.displayableNotes();
    return displayableNotes.find(note => !note.protected);
  }

  selectFirstNote() {
    const note = this.getFirstNonProtectedNote();
    if (note) {
      this.selectNote(note);
    }
  }

  selectNextNote() {
    const displayableNotes = this.displayableNotes();
    const currentIndex = displayableNotes.findIndex((candidate) => {
      return candidate.uuid === this.activeEditorNote!.uuid
    });
    if (currentIndex + 1 < displayableNotes.length) {
      this.selectNote(displayableNotes[currentIndex + 1]);
    }
  }

  selectNextOrCreateNew() {
    const note = this.getFirstNonProtectedNote();
    if (note) {
      this.selectNote(note);
    } else if (!this.appState.selectedTag || !this.appState.selectedTag.isSmartTag()) {
      this.createPlaceholderNote();
    } else {
      this.appState.closeActiveEditor();
    }
  }

  selectPreviousNote() {
    const displayableNotes = this.displayableNotes();
    const currentIndex = displayableNotes.indexOf(this.activeEditorNote!);
    if (currentIndex - 1 >= 0) {
      this.selectNote(displayableNotes[currentIndex - 1]);
      return true;
    } else {
      return false;
    }
  }

  isFiltering() {
    return this.getState().noteFilter.text &&
      this.getState().noteFilter.text.length > 0;
  }

  async setNoteFilterText(text: string) {
    await this.setNotesState({
      noteFilter: {
        ...this.getState().noteFilter,
        text: text
      }
    });
  }

  async clearFilterText() {
    await this.setNoteFilterText('');
    this.onFilterEnter();
    this.filterTextChanged();
    this.resetPagination();
  }

  async filterTextChanged() {
    if (this.searchSubmitted) {
      this.searchSubmitted = false;
    }
    this.reloadNotesDisplayOptions();
    await this.reloadNotes();
  }

  onFilterEnter() {
    /**
     * For Desktop, performing a search right away causes
     * input to lose focus. We wait until user explicity hits
     * enter before highlighting desktop search results.
     */
    this.searchSubmitted = true;
    this.application!.getDesktopService().searchText(this.getState().noteFilter.text);
  }

  selectedMenuItem() {
    this.setShowMenuFalse();
  }

  toggleWebPrefKey(key: WebPrefKey) {
    this.application!.getPrefsService().setUserPrefValue(
      key,
      !this.state[key],
      true
    );
  }

  selectedSortByCreated() {
    this.setSortBy(NoteSortKey.CreatedAt);
  }

  selectedSortByUpdated() {
    this.setSortBy(NoteSortKey.ClientUpdatedAt);
  }

  selectedSortByTitle() {
    this.setSortBy(NoteSortKey.Title);
  }

  toggleReverseSort() {
    this.selectedMenuItem();
    this.application!.getPrefsService().setUserPrefValue(
      WebPrefKey.SortNotesReverse,
      !this.getState().sortReverse,
      true
    );
  }

  setSortBy(type: NoteSortKey) {
    this.application!.getPrefsService().setUserPrefValue(
      WebPrefKey.SortNotesBy,
      type,
      true
    );
  }

  getSearchBar() {
    return document.getElementById(ELEMENT_ID_SEARCH_BAR)!;
  }

  registerKeyboardShortcuts() {
    /**
     * In the browser we're not allowed to override cmd/ctrl + n, so we have to
     * use Control modifier as well. These rules don't apply to desktop, but
     * probably better to be consistent.
     */
    this.newNoteKeyObserver = this.application!.getKeyboardService().addKeyObserver({
      key: 'n',
      modifiers: [
        KeyboardModifier.Meta,
        KeyboardModifier.Ctrl
      ],
      onKeyDown: (event) => {
        event.preventDefault();
        this.createNewNote();
      }
    });

    this.nextNoteKeyObserver = this.application!.getKeyboardService().addKeyObserver({
      key: KeyboardKey.Down,
      elements: [
        document.body,
        this.getSearchBar()
      ],
      onKeyDown: () => {
        const searchBar = this.getSearchBar();
        if (searchBar === document.activeElement) {
          searchBar.blur();
        }
        this.selectNextNote();
      }
    });

    this.previousNoteKeyObserver = this.application!.getKeyboardService().addKeyObserver({
      key: KeyboardKey.Up,
      element: document.body,
      onKeyDown: () => {
        this.selectPreviousNote();
      }
    });

    this.searchKeyObserver = this.application!.getKeyboardService().addKeyObserver({
      key: "f",
      modifiers: [
        KeyboardModifier.Meta,
        KeyboardModifier.Shift
      ],
      onKeyDown: () => {
        const searchBar = this.getSearchBar();
        if (searchBar) { searchBar.focus(); };
      }
    });
  }
}

export class NotesView extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.replace = true;
    this.controller = NotesViewCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
