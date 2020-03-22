import angular from 'angular';
import template from '%/notes.pug';
import { ApplicationEvents, ContentTypes, removeFromArray } from 'snjs';
import { PureCtrl } from '@Controllers';
import { AppStateEvents } from '@/state';
import { KeyboardModifiers, KeyboardKeys } from '@/services/keyboardManager';
import {
  PrefKeys
} from '@/services/preferencesManager';
import {
  PANEL_NAME_NOTES
} from '@/controllers/constants';
import {
  SORT_KEY_CREATED_AT,
  SORT_KEY_UPDATED_AT,
  SORT_KEY_CLIENT_UPDATED_AT,
  SORT_KEY_TITLE,
  filterAndSortNotes
} from './note_utils';

/**
 * This is the height of a note cell with nothing but the title,
 * which *is* a display option
 */
const MIN_NOTE_CELL_HEIGHT = 51.0;
const DEFAULT_LIST_NUM_NOTES = 20;
const ELEMENT_ID_SEARCH_BAR = 'search-bar';
const ELEMENT_ID_SCROLL_CONTAINER = 'notes-scrollable';

class NotesCtrl extends PureCtrl {

  /* @ngInject */
  constructor(
    $scope,
    $timeout,
    $rootScope,
    application,
    appState,
    desktopManager,
    keyboardManager,
    preferencesManager,
  ) {
    super($scope, $timeout, application, appState);
    this.$rootScope = $rootScope;
    this.application = application;
    this.appState = appState;
    this.desktopManager = desktopManager;
    this.keyboardManager = keyboardManager;
    this.preferencesManager = preferencesManager;
    this.resetPagination();
    this.registerKeyboardShortcuts();
  }

  $onInit() {
    super.$onInit();
    angular.element(document).ready(() => {
      this.reloadPreferences();
    });
    this.panelPuppet = {
      onReady: () => this.reloadPreferences()
    };
    window.onresize = (event) => {
      this.resetPagination({
        keepCurrentIfLarger: true
      });
    };
  }

  getInitialState() {
    return {
      notes: [],
      renderedNotes: [],
      selectedNote: null,
      tag: null,
      sortBy: null,
      showArchived: null,
      hidePinned: null,
      sortReverse: null,
      panelTitle: null,
      mutable: { showMenu: false },
      noteFilter: { text: '' },
    };
  }

  onAppLaunch() {
    super.onAppLaunch();
    this.streamNotesAndTags();
    this.reloadPreferences();
  }

  /** @override */
  onAppStateEvent(eventName, data) {
    if (eventName === AppStateEvents.TagChanged) {
      this.handleTagChange(this.appState.getSelectedTag(), data.previousTag);
    } else if (eventName === AppStateEvents.NoteChanged) {
      this.handleNoteSelection(this.appState.getSelectedNote());
    } else if (eventName === AppStateEvents.PreferencesChanged) {
      this.reloadPreferences();
      this.reloadNotes();
    } else if (eventName === AppStateEvents.EditorFocused) {
      this.setShowMenuFalse();
    }
  }

  /** @override */
  async onAppEvent(eventName) {
    if (eventName === ApplicationEvents.SignedIn) {
      /** Delete dummy note if applicable */
      if (this.state.selectedNote && this.state.selectedNote.dummy) {
        this.application.deleteItemLocally({ item: this.state.selectedNote });
        await this.selectNote(null);
        await this.reloadNotes();
      }
    } else if (eventName === ApplicationEvents.CompletedSync) {
      if (this.state.notes.length === 0) {
        await this.createPlaceholderNote();
      }
    } else if (eventName === ApplicationEvents.LocalDataLoaded) {
      if (this.application.getLastSyncDate() && this.state.notes.length === 0) {
        await this.createPlaceholderNote();
      }
    }
  }

  /** 
   * Triggered programatically to create a new placeholder note 
   * when conditions allow for it. This is as opposed to creating a new note
   * as part of user interaction (pressing the + button).
   * @access private
   */
  async createPlaceholderNote() {
    const selectedTag = this.appState.getSelectedTag();
    if(selectedTag.isSmartTag() && !selectedTag.content.isAllTag) {
      return;
    }
    return this.createNewNote();
  }

  streamNotesAndTags() {
    this.application.streamItems({
      contentType: [ContentTypes.Note, ContentTypes.Tag],
      stream: async ({ items }) => {
        await this.reloadNotes();
        const selectedNote = this.state.selectedNote;
        if (selectedNote) {
          const discarded = selectedNote.deleted || selectedNote.content.trashed;
          if (discarded) {
            this.selectNextOrCreateNew();
          }
        } else {
          this.selectFirstNote();
        }

        /** Note has changed values, reset its flags */
        const notes = items.filter((item) => item.content_type === ContentTypes.Note);
        for (const note of notes) {
          this.loadFlagsForNote(note);
          note.cachedCreatedAtString = note.createdAtString();
          note.cachedUpdatedAtString = note.updatedAtString();
        }
      }
    });
  }

  async selectNote(note) {
    this.appState.setSelectedNote(note);
  }

  async createNewNote() {
    const selectedTag = this.appState.getSelectedTag();
    if (!selectedTag) {
      throw 'Attempting to create note with no selected tag';
    }
    let title;
    let isDummyNote = true;
    if (this.isFiltering()) {
      title = this.state.noteFilter.text;
      isDummyNote = false;
    } else if (this.state.selectedNote && this.state.selectedNote.dummy) {
      return;
    } else {
      title = `Note ${this.state.notes.length + 1}`;
    }
    const newNote = await this.application.createManagedItem({
      contentType: ContentTypes.Note,
      content: {
        text: '',
        title: title
      },
      override: {
        dummy: isDummyNote,
        client_updated_at: new Date()
      }
    });
    this.application.setItemNeedsSync({ item: newNote });
    if (!selectedTag.isSmartTag()) {
      selectedTag.addItemAsRelationship(newNote);
      this.application.setItemNeedsSync({ item: selectedTag });
    }
    this.selectNote(newNote);
  }

  async handleTagChange(tag, previousTag) {
    if (this.state.selectedNote && this.state.selectedNote.dummy) {
      await this.application.deleteItemLocally({ item: this.state.selectedNote });
      if (previousTag) {
        removeFromArray(previousTag.notes, this.state.selectedNote);
      }
      await this.selectNote(null);
    }
    await this.setState({ tag: tag });
    
    this.resetScrollPosition();
    this.setShowMenuFalse();
    await this.setNoteFilterText('');
    this.desktopManager.searchText();
    this.resetPagination();

    /* Capture db load state before beginning reloadNotes, since this status may change during reload */
    const dbLoaded = this.application.isDatabaseLoaded();
    await this.reloadNotes();

    if (this.state.notes.length > 0) {
      this.selectFirstNote();
    } else if (dbLoaded) {
      if (!tag.isSmartTag() || tag.content.isAllTag) {
        this.createPlaceholderNote();
      } else if (
        this.state.selectedNote &&
        !this.state.notes.includes(this.state.selectedNote)
      ) {
        this.selectNote(null);
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

  async removeNoteFromList(note) {
    const notes = this.state.notes;
    removeFromArray(notes, note);
    await this.setState({
      notes: notes,
      renderedNotes: notes.slice(0, this.notesToDisplay)
    });
  }

  async reloadNotes() {
    if (!this.state.tag) {
      return;
    }
    const notes = filterAndSortNotes({
      notes: this.state.tag.notes,
      selectedTag: this.state.tag,
      showArchived: this.state.showArchived,
      hidePinned: this.state.hidePinned,
      filterText: this.state.noteFilter.text.toLowerCase(),
      sortBy: this.state.sortBy,
      reverse: this.state.sortReverse
    });
    for (const note of notes) {
      if (note.errorDecrypting) {
        this.loadFlagsForNote(note);
      }
      note.shouldShowTags = this.shouldShowTagsForNote(note);
    }
    await this.setState({
      notes: notes,
      renderedNotes: notes.slice(0, this.notesToDisplay)
    });
    this.reloadPanelTitle();
  }

  setShowMenuFalse() {
    this.setState({
      mutable: {
        ...this.state.mutable,
        showMenu: false
      }
    });
  }

  async handleNoteSelection(note) {
    const previousNote = this.state.selectedNote;
    if (previousNote === note) {
      return;
    }
    if (previousNote && previousNote.dummy) {
      await this.application.deleteItemLocally({ item: previousNote });
      this.removeNoteFromList(previousNote);
    }
    await this.setState({
      selectedNote: note
    });
    if (!note) {
      return;
    }
    this.selectedIndex = Math.max(0, this.displayableNotes().indexOf(note));
    if (note.content.conflict_of) {
      note.content.conflict_of = null;
      this.application.saveItem({ item: note });
    }
    if (this.isFiltering()) {
      this.desktopManager.searchText(this.state.noteFilter.text);
    }
  }

  reloadPreferences() {
    const viewOptions = {};
    const prevSortValue = this.state.sortBy;
    let sortBy = this.preferencesManager.getValue(
      PrefKeys.SortNotesBy,
      SORT_KEY_CREATED_AT
    );
    if (sortBy === SORT_KEY_UPDATED_AT) {
      /** Use client_updated_at instead */
      sortBy = SORT_KEY_CLIENT_UPDATED_AT;
    }
    viewOptions.sortBy = sortBy;
    viewOptions.sortReverse = this.preferencesManager.getValue(
      PrefKeys.SortNotesReverse,
      false
    );
    viewOptions.showArchived = this.preferencesManager.getValue(
      PrefKeys.NotesShowArchived,
      false
    );
    viewOptions.hidePinned = this.preferencesManager.getValue(
      PrefKeys.NotesHidePinned,
      false
    );
    viewOptions.hideNotePreview = this.preferencesManager.getValue(
      PrefKeys.NotesHideNotePreview,
      false
    );
    viewOptions.hideDate = this.preferencesManager.getValue(
      PrefKeys.NotesHideDate,
      false
    );
    viewOptions.hideTags = this.preferencesManager.getValue(
      PrefKeys.NotesHideTags,
      false
    );
    this.setState({
      ...viewOptions
    });
    if (prevSortValue && prevSortValue !== sortBy) {
      this.selectFirstNote();
    }
    const width = this.preferencesManager.getValue(
      PrefKeys.NotesPanelWidth
    );
    if (width && this.panelPuppet.ready) {
      this.panelPuppet.setWidth(width);
      if (this.panelPuppet.isCollapsed()) {
        this.appState.panelDidResize({
          name: PANEL_NAME_NOTES,
          collapsed: this.panelPuppet.isCollapsed()
        });
      }
    }
  }

  onPanelResize = (newWidth, lastLeft, isAtMaxWidth, isCollapsed) => {
    this.preferencesManager.setUserPrefValue(
      PrefKeys.NotesPanelWidth,
      newWidth
    );
    this.preferencesManager.syncUserPreferences();
    this.appState.panelDidResize({
      name: PANEL_NAME_NOTES,
      collapsed: isCollapsed
    });
  }

  paginate() {
    this.notesToDisplay += this.pageSize;
    this.reloadNotes();
    if (this.searchSubmitted) {
      this.desktopManager.searchText(this.state.noteFilter.text);
    }
  }

  resetPagination({ keepCurrentIfLarger } = {}) {
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
      const resultCount = this.state.notes.length;
      title = `${resultCount} search results`;
    } else if (this.state.tag) {
      title = `${this.state.tag.title}`;
    }
    this.setState({
      panelTitle: title
    });
  }

  optionsSubtitle() {
    let base = "";
    if (this.state.sortBy === 'created_at') {
      base += " Date Added";
    } else if (this.state.sortBy === 'client_updated_at') {
      base += " Date Modified";
    } else if (this.state.sortBy === 'title') {
      base += " Title";
    }
    if (this.state.showArchived) {
      base += " | + Archived";
    }
    if (this.state.hidePinned) {
      base += " | – Pinned";
    }
    if (this.state.sortReverse) {
      base += " | Reversed";
    }
    return base;
  }

  loadFlagsForNote(note) {
    const flags = [];
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
    if (note.content.protected) {
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
    if (note.content.trashed) {
      flags.push({
        text: "Deleted",
        class: 'danger'
      });
    }
    if (note.content.conflict_of) {
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
    note.flags = flags;
    return flags;
  }

  displayableNotes() {
    return this.state.notes;
  }

  getFirstNonProtectedNote() {
    const displayableNotes = this.displayableNotes();
    let index = 0;
    let note = displayableNotes[index];
    while (note && note.content.protected) {
      index++;
      if (index >= displayableNotes.length) {
        break;
      }
      note = displayableNotes[index];
    }
    return note;
  }

  selectFirstNote() {
    const note = this.getFirstNonProtectedNote();
    if (note) {
      this.selectNote(note);
    }
  }

  selectNextNote() {
    const displayableNotes = this.displayableNotes();
    const currentIndex = displayableNotes.indexOf(this.state.selectedNote);
    if (currentIndex + 1 < displayableNotes.length) {
      this.selectNote(displayableNotes[currentIndex + 1]);
    }
  }

  selectNextOrCreateNew() {
    const note = this.getFirstNonProtectedNote();
    if (note) {
      this.selectNote(note);
    } else if (!this.state.tag || !this.state.tag.isSmartTag()) {
      this.createPlaceholderNote();
    } else {
      this.selectNote(null);
    }
  }

  selectPreviousNote() {
    const displayableNotes = this.displayableNotes();
    const currentIndex = displayableNotes.indexOf(this.state.selectedNote);
    if (currentIndex - 1 >= 0) {
      this.selectNote(displayableNotes[currentIndex - 1]);
      return true;
    } else {
      return false;
    }
  }

  isFiltering() {
    return this.state.noteFilter.text &&
      this.state.noteFilter.text.length > 0;
  }

  async setNoteFilterText(text) {
    await this.setState({
      noteFilter: {
        ...this.state.noteFilter,
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
    await this.reloadNotes();
  }

  onFilterEnter() {
    /**
     * For Desktop, performing a search right away causes
     * input to lose focus. We wait until user explicity hits
     * enter before highlighting desktop search results.
     */
    this.searchSubmitted = true;
    this.desktopManager.searchText(this.state.noteFilter.text);
  }

  selectedMenuItem() {
    this.setShowMenuFalse();
  }

  togglePrefKey(key) {
    this.preferencesManager.setUserPrefValue(key, !this.state[key]);
    this.preferencesManager.syncUserPreferences();
  }

  selectedSortByCreated() {
    this.setSortBy(SORT_KEY_CREATED_AT);
  }

  selectedSortByUpdated() {
    this.setSortBy(SORT_KEY_CLIENT_UPDATED_AT);
  }

  selectedSortByTitle() {
    this.setSortBy(SORT_KEY_TITLE);
  }

  toggleReverseSort() {
    this.selectedMenuItem();
    this.preferencesManager.setUserPrefValue(
      PrefKeys.SortNotesReverse,
      !this.state.sortReverse
    );
    this.preferencesManager.syncUserPreferences();
  }

  setSortBy(type) {
    this.preferencesManager.setUserPrefValue(
      PrefKeys.SortNotesBy,
      type
    );
    this.preferencesManager.syncUserPreferences();
  }

  shouldShowTagsForNote(note) {
    if (this.state.hideTags || note.content.protected) {
      return false;
    }
    if (this.state.tag.content.isAllTag) {
      return note.tags && note.tags.length > 0;
    }
    if (this.state.tag.isSmartTag()) {
      return true;
    }
    /**
     * Inside a tag, only show tags string if
     * note contains tags other than this.state.tag
     */
    return note.tags && note.tags.length > 1;
  }

  getSearchBar() {
    return document.getElementById(ELEMENT_ID_SEARCH_BAR);
  }

  registerKeyboardShortcuts() {
    /**
     * In the browser we're not allowed to override cmd/ctrl + n, so we have to
     * use Control modifier as well. These rules don't apply to desktop, but
     * probably better to be consistent.
     */
    this.newNoteKeyObserver = this.keyboardManager.addKeyObserver({
      key: 'n',
      modifiers: [
        KeyboardModifiers.Meta,
        KeyboardModifiers.Ctrl
      ],
      onKeyDown: (event) => {
        event.preventDefault();
        this.createNewNote();
      }
    });

    this.nextNoteKeyObserver = this.keyboardManager.addKeyObserver({
      key: KeyboardKeys.Down,
      elements: [
        document.body,
        this.getSearchBar()
      ],
      onKeyDown: (event) => {
        const searchBar = this.getSearchBar();
        if (searchBar === document.activeElement) {
          searchBar.blur();
        }
        this.selectNextNote();
      }
    });

    this.nextNoteKeyObserver = this.keyboardManager.addKeyObserver({
      key: KeyboardKeys.Up,
      element: document.body,
      onKeyDown: (event) => {
        this.selectPreviousNote();
      }
    });

    this.searchKeyObserver = this.keyboardManager.addKeyObserver({
      key: "f",
      modifiers: [
        KeyboardModifiers.Meta,
        KeyboardModifiers.Shift
      ],
      onKeyDown: (event) => {
        const searchBar = this.getSearchBar();
        if (searchBar) { searchBar.focus(); };
      }
    });
  }
}

export class NotesPanel {
  constructor() {
    this.scope = {};
    this.template = template;
    this.replace = true;
    this.controller = NotesCtrl;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
