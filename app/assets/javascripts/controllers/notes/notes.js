import _ from 'lodash';
import angular from 'angular';
import template from '%/notes.pug';
import { SFAuthManager } from 'snjs';
import { KeyboardManager } from '@/services/keyboardManager';
import { PureCtrl } from '@Controllers';
import {
  APP_STATE_EVENT_NOTE_CHANGED,
  APP_STATE_EVENT_TAG_CHANGED,
  APP_STATE_EVENT_PREFERENCES_CHANGED,
  APP_STATE_EVENT_EDITOR_FOCUSED
} from '@/state';
import {
  PREF_NOTES_PANEL_WIDTH,
  PREF_SORT_NOTES_BY,
  PREF_SORT_NOTES_REVERSE,
  PREF_NOTES_SHOW_ARCHIVED,
  PREF_NOTES_HIDE_PINNED,
  PREF_NOTES_HIDE_NOTE_PREVIEW,
  PREF_NOTES_HIDE_DATE,
  PREF_NOTES_HIDE_TAGS
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
    $timeout,
    $rootScope,
    appState,
    authManager,
    desktopManager,
    keyboardManager,
    modelManager,
    preferencesManager,
    privilegesManager,
    syncManager,
  ) {
    super($timeout);
    this.$rootScope = $rootScope;
    this.appState = appState;
    this.authManager = authManager;
    this.desktopManager = desktopManager;
    this.keyboardManager = keyboardManager;
    this.modelManager = modelManager;
    this.preferencesManager = preferencesManager;
    this.privilegesManager = privilegesManager;
    this.syncManager = syncManager;

    this.state = {
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

    this.panelController = {};
    window.onresize = (event) => {
      this.resetPagination({
        keepCurrentIfLarger: true
      });
    };

    this.addAppStateObserver();
    this.addSignInObserver();
    this.addSyncEventHandler();
    this.addMappingObserver();
    this.reloadPreferences();
    this.resetPagination();
    this.registerKeyboardShortcuts();
    angular.element(document).ready(() => {
      this.reloadPreferences();
    });
  }

  addAppStateObserver() {
    this.appState.addObserver((eventName, data) => {
      if (eventName === APP_STATE_EVENT_TAG_CHANGED) {
        this.handleTagChange(this.appState.getSelectedTag(), data.previousTag);
      } else if (eventName === APP_STATE_EVENT_NOTE_CHANGED) {
        this.handleNoteSelection(this.appState.getSelectedNote());
      } else if (eventName === APP_STATE_EVENT_PREFERENCES_CHANGED) {
        this.reloadPreferences();
        this.reloadNotes();
      } else if (eventName === APP_STATE_EVENT_EDITOR_FOCUSED) {
        this.setShowMenuFalse();
      }
    });
  }

  addSignInObserver() {
    this.authManager.addEventHandler((event) => {
      if (event === SFAuthManager.DidSignInEvent) {
        /** Delete dummy note if applicable */
        if (this.state.selectedNote && this.state.selectedNote.dummy) {
          this.modelManager.removeItemLocally(this.state.selectedNote);
          this.selectNote(null).then(() => {
            this.reloadNotes();
          });
          /**
           * We want to see if the user will download any items from the server.
           * If the next sync completes and our notes are still 0,
           * we need to create a dummy.
           */
          this.createDummyOnSynCompletionIfNoNotes = true;
        }
      }
    });
  }

  addSyncEventHandler() {
    this.syncManager.addEventHandler((syncEvent, data) => {
      if (syncEvent === 'local-data-loaded') {
        if (this.state.notes.length === 0) {
          this.createNewNote();
        }
      } else if (syncEvent === 'sync:completed') {
        if (this.createDummyOnSynCompletionIfNoNotes && this.state.notes.length === 0) {
          this.createDummyOnSynCompletionIfNoNotes = false;
          this.createNewNote();
        }
      }
    });
  }

  addMappingObserver() {
    this.modelManager.addItemSyncObserver(
      'note-list',
      '*',
      async (allItems, validItems, deletedItems, source, sourceKey) => {
        await this.reloadNotes();
        const selectedNote = this.state.selectedNote;
        if (selectedNote) {
          const discarded = selectedNote.deleted || selectedNote.content.trashed;
          const notIncluded = !this.state.notes.includes(selectedNote);
          if (notIncluded || discarded) {
            this.selectNextOrCreateNew();
          }
        } else {
          this.selectFirstNote();
        }

        /** Note has changed values, reset its flags */
        const notes = allItems.filter((item) => item.content_type === 'Note');
        for (const note of notes) {
          this.loadFlagsForNote(note);
          note.cachedCreatedAtString = note.createdAtString();
          note.cachedUpdatedAtString = note.updatedAtString();
        }
      });
  }

  async handleTagChange(tag, previousTag) {
    if (this.state.selectedNote && this.state.selectedNote.dummy) {
      this.modelManager.removeItemLocally(this.state.selectedNote);
      if (previousTag) {
        _.remove(previousTag.notes, this.state.selectedNote);
      }
      await this.selectNote(null);
    }

    await this.setState({
      tag: tag
    });

    this.resetScrollPosition();
    this.setShowMenuFalse();
    await this.setNoteFilterText('');
    this.desktopManager.searchText();
    this.resetPagination();

    await this.reloadNotes();

    if (this.state.notes.length > 0) {
      this.selectFirstNote();
    } else if (this.syncManager.initialDataLoaded()) {
      if (!tag.isSmartTag() || tag.content.isAllTag) {
        this.createNewNote();
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

  /** 
   * @template
   * @internal 
   */
  async selectNote(note) {
    this.appState.setSelectedNote(note);
  }

  async removeNoteFromList(note) {
    const notes = this.state.notes;
    _.pull(notes, note);
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
      filterText: this.state.noteFilter.text,
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
    if (this.state.selectedNote === note) {
      return;
    }
    const previousNote = this.state.selectedNote;
    if (previousNote && previousNote.dummy) {
      this.modelManager.removeItemLocally(previousNote);
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
      this.modelManager.setItemDirty(note);
      this.syncManager.sync();
    }
    if (this.isFiltering()) {
      this.desktopManager.searchText(this.state.noteFilter.text);
    }
  }

  reloadPreferences() {
    const viewOptions = {};
    const prevSortValue = this.state.sortBy;
    let sortBy = this.preferencesManager.getValue(
      PREF_SORT_NOTES_BY,
      SORT_KEY_CREATED_AT
    );
    if (sortBy === SORT_KEY_UPDATED_AT) {
      /** Use client_updated_at instead */
      sortBy = SORT_KEY_CLIENT_UPDATED_AT;
    }
    viewOptions.sortBy = sortBy;
    viewOptions.sortReverse = this.preferencesManager.getValue(
      PREF_SORT_NOTES_REVERSE,
      false
    );
    viewOptions.showArchived = this.preferencesManager.getValue(
      PREF_NOTES_SHOW_ARCHIVED,
      false
    );
    viewOptions.hidePinned = this.preferencesManager.getValue(
      PREF_NOTES_HIDE_PINNED,
      false
    );
    viewOptions.hideNotePreview = this.preferencesManager.getValue(
      PREF_NOTES_HIDE_NOTE_PREVIEW,
      false
    );
    viewOptions.hideDate = this.preferencesManager.getValue(
      PREF_NOTES_HIDE_DATE,
      false
    );
    viewOptions.hideTags = this.preferencesManager.getValue(
      PREF_NOTES_HIDE_TAGS,
      false
    );
    this.setState({
      ...viewOptions
    });
    if (prevSortValue && prevSortValue !== sortBy) {
      this.selectFirstNote();
    }
    const width = this.preferencesManager.getValue(
      PREF_NOTES_PANEL_WIDTH
    );
    if (width) {
      this.panelController.setWidth(width);
      if (this.panelController.isCollapsed()) {
        this.appState.panelDidResize({
          name: PANEL_NAME_NOTES,
          collapsed: this.panelController.isCollapsed()
        });
      }
    }
  }

  onPanelResize = (newWidth, lastLeft, isAtMaxWidth, isCollapsed) => {
    this.preferencesManager.setUserPrefValue(
      PREF_NOTES_PANEL_WIDTH,
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
    this.pageSize = clientHeight / MIN_NOTE_CELL_HEIGHT;
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
      flags.push({
        text: "Missing Keys",
        class: 'danger'
      });
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
      this.createNewNote();
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

  createNewNote() {
    if (this.state.selectedNote && this.state.selectedNote.dummy) {
      return;
    }
    const title = "Note" + (this.state.notes ? (" " + (this.state.notes.length + 1)) : "");
    const newNote = this.modelManager.createItem({
      content_type: 'Note',
      content: {
        text: '',
        title: title
      }
    });
    newNote.client_updated_at = new Date();
    newNote.dummy = true;
    this.modelManager.addItem(newNote);
    this.modelManager.setItemDirty(newNote);
    const selectedTag = this.appState.getSelectedTag();
    if (!selectedTag.isSmartTag()) {
      selectedTag.addItemAsRelationship(newNote);
      this.modelManager.setItemDirty(selectedTag);
    }
    this.selectNote(newNote);
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
      PREF_SORT_NOTES_REVERSE,
      !this.state.sortReverse
    );
    this.preferencesManager.syncUserPreferences();
  }

  setSortBy(type) {
    this.preferencesManager.setUserPrefValue(
      PREF_SORT_NOTES_BY,
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
        KeyboardManager.KeyModifierMeta,
        KeyboardManager.KeyModifierCtrl
      ],
      onKeyDown: (event) => {
        event.preventDefault();
        this.createNewNote();
      }
    });

    this.nextNoteKeyObserver = this.keyboardManager.addKeyObserver({
      key: KeyboardManager.KeyDown,
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
      key: KeyboardManager.KeyUp,
      element: document.body,
      onKeyDown: (event) => {
        this.selectPreviousNote();
      }
    });

    this.searchKeyObserver = this.keyboardManager.addKeyObserver({
      key: "f",
      modifiers: [
        KeyboardManager.KeyModifierMeta,
        KeyboardManager.KeyModifierShift
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
