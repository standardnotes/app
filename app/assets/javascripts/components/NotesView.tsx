import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  ApplicationEvent,
  CollectionSort,
  ContentType,
  NotesDisplayCriteria,
  PrefKey,
  SNNote,
  UuidString,
} from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useState } from 'preact/hooks';
import { NoAccountWarning } from './NoAccountWarning';
import { NotesList } from './NotesList';
import { NotesListOptionsMenu } from './NotesListOptionsMenu';
import { SearchOptions } from './SearchOptions';
import { toDirective } from './utils';

const MIN_NOTE_CELL_HEIGHT = 51.0;
const DEFAULT_LIST_NUM_NOTES = 20;

type Props = {
  application: WebApplication;
  appState: AppState;
};

type DisplayOptions = {
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

const NotesView: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const [notes, setNotes] = useState<SNNote[]>([]);
    const [renderedNotes, setRenderedNotes] = useState<SNNote[]>([]);
    const [selectedNotes, setSelectedNotes] = useState<
      Record<UuidString, SNNote>
    >(() => appState.notes.selectedNotes);
    const [panelTitle] = useState('All Notes');
    const [noteFilterText, setNoteFilterText] = useState('');
    const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false);
    const [notesToDisplay] = useState(20);
    const [completedFullSync, setCompletedFullSync] = useState(false);
    const [displayOptions, setDisplayOptions] = useState<DisplayOptions>({
      sortBy: CollectionSort.CreatedAt,
      sortReverse: false,
      hidePinned: false,
      showArchived: false,
      showTrashed: false,
      hideProtected: false,
      hideTags: true,
      hideDate: false,
      hideNotePreview: false,
    });

    const getOptionsSubtitle = () => {
      let base = '';
      if (displayOptions.sortBy === CollectionSort.CreatedAt) {
        base += ' Date Added';
      } else if (displayOptions.sortBy === CollectionSort.UpdatedAt) {
        base += ' Date Modified';
      } else if (displayOptions.sortBy === CollectionSort.Title) {
        base += ' Title';
      }
      if (displayOptions.showArchived) {
        base += ' | + Archived';
      }
      if (displayOptions.showTrashed) {
        base += ' | + Trashed';
      }
      if (displayOptions.hidePinned) {
        base += ' | – Pinned';
      }
      if (displayOptions.hideProtected) {
        base += ' | – Protected';
      }
      if (displayOptions.sortReverse) {
        base += ' | Reversed';
      }
      return base;
    };

    const reloadNotes = useCallback(async () => {
      const tag = appState.selectedTag;
      if (!tag) {
        return;
      }
      const notes = application.getDisplayableItems(
        ContentType.Note
      ) as SNNote[];
      setNotes(notes);
      setRenderedNotes(notes.slice(0, notesToDisplay));
    }, [appState, application, notesToDisplay]);

    const reloadNotesDisplayOptions = useCallback(
      async (displayOptions: DisplayOptions) => {
        const tag = appState.selectedTag;

        const searchText = noteFilterText.toLowerCase();
        const isSearching = searchText.length;
        //let includeArchived: boolean;
        //let includeTrashed: boolean;

        if (isSearching) {
          //includeArchived = this.state.searchOptions.includeArchived;
          //includeTrashed = this.state.searchOptions.includeTrashed;
        } else {
          //
        }
        const includeArchived = displayOptions.showArchived ?? false;
        const includeTrashed = displayOptions.showTrashed ?? false;

        const criteria = NotesDisplayCriteria.Create({
          sortProperty: displayOptions.sortBy as CollectionSort,
          sortDirection: displayOptions.sortReverse ? 'asc' : 'dsc',
          tags: tag ? [tag] : [],
          includeArchived,
          includeTrashed,
          includePinned: !displayOptions.hidePinned,
          includeProtected: !displayOptions.hideProtected,
          /* searchQuery: {
          query: searchText,
          includeProtectedNoteText: this.state.searchOptions.includeProtectedContents
        } */
        });
        application.setNotesDisplayCriteria(criteria);
      },
      [appState.selectedTag, application, noteFilterText]
    );

    const getSelectedTag = useCallback(
      () => appState.getSelectedTag(),
      [appState]
    );

    const createNewNote = useCallback(
      async (focusNewNote = true) => {
        appState.notes.unselectNotes();
        const title = `Note ${notes.length + 1}`;
        appState.createEditor(title);
        await appState.noteTags.reloadTags();
        const noteTitleEditorElement =
          document.getElementById('note-title-editor');
        if (focusNewNote) {
          noteTitleEditorElement?.focus();
        }
      },
      [appState, notes]
    );

    const createPlaceholderNote = useCallback(async () => {
      const selectedTag = getSelectedTag();
      if (selectedTag && selectedTag.isSmartTag && !selectedTag.isAllTag) {
        return;
      }
      return createNewNote(false);
    }, [getSelectedTag, createNewNote]);

    const getFirstNonProtectedNote = useCallback(() => {
      return notes.find((note) => !note.protected);
    }, [notes]);

    const selectNote = useCallback(
      async (note: SNNote, userTriggered?: boolean) => {
        await appState.notes.selectNote(note.uuid, userTriggered);
      },
      [appState]
    );

    const selectFirstNote = useCallback(() => {
      const note = getFirstNonProtectedNote();
      if (note) {
        selectNote(note);
      }
    }, [getFirstNonProtectedNote, selectNote]);

    const reloadPreferences = useCallback(async () => {
      const freshDisplayOptions = {} as DisplayOptions;
      let sortBy = application.getPreference(
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
      freshDisplayOptions.sortReverse = application.getPreference(
        PrefKey.SortNotesReverse,
        false
      );
      freshDisplayOptions.showArchived = application.getPreference(
        PrefKey.NotesShowArchived,
        false
      );
      freshDisplayOptions.showTrashed = application.getPreference(
        PrefKey.NotesShowTrashed,
        false
      ) as boolean;
      freshDisplayOptions.hidePinned = application.getPreference(
        PrefKey.NotesHidePinned,
        false
      );
      freshDisplayOptions.hideProtected = application.getPreference(
        PrefKey.NotesHideProtected,
        false
      );
      freshDisplayOptions.hideNotePreview = application.getPreference(
        PrefKey.NotesHideNotePreview,
        false
      );
      freshDisplayOptions.hideDate = application.getPreference(
        PrefKey.NotesHideDate,
        false
      );
      freshDisplayOptions.hideTags = application.getPreference(
        PrefKey.NotesHideTags,
        true
      );
      const displayOptionsChanged =
        freshDisplayOptions.sortBy !== displayOptions.sortBy ||
        freshDisplayOptions.sortReverse !== displayOptions.sortReverse ||
        freshDisplayOptions.hidePinned !== displayOptions.hidePinned ||
        freshDisplayOptions.showArchived !== displayOptions.showArchived ||
        freshDisplayOptions.showTrashed !== displayOptions.showTrashed ||
        freshDisplayOptions.hideProtected !== displayOptions.hideProtected ||
        freshDisplayOptions.hideTags !== displayOptions.hideTags;
      setDisplayOptions({
        ...freshDisplayOptions,
      });
      if (displayOptionsChanged) {
        await reloadNotesDisplayOptions(freshDisplayOptions);
      }
      await reloadNotes();
    }, [application, displayOptions, reloadNotes, reloadNotesDisplayOptions]);

    const onNoteFilterTextChange = (e: Event) => {
      setNoteFilterText((e.target as HTMLInputElement).value);
    };

    useEffect(() => {
      const removeObserver = application.addEventObserver(
        async (eventName: ApplicationEvent) => {
          switch (eventName) {
            case ApplicationEvent.PreferencesChanged:
              reloadPreferences();
              break;
            case ApplicationEvent.SignedIn:
              appState.closeAllEditors();
              selectFirstNote();
              setCompletedFullSync(true);
              break;
            case ApplicationEvent.CompletedFullSync:
              await reloadNotes();
              setCompletedFullSync(true);
              break;
          }
        }
      );

      return () => {
        removeObserver();
      };
    }, [
      application,
      appState,
      reloadNotes,
      selectFirstNote,
      reloadPreferences,
    ]);

    useEffect(() => {
      if (notes.length === 0 && getSelectedTag()?.isAllTag && !noteFilterText) {
        createPlaceholderNote();
      }
    }, [notes, noteFilterText, getSelectedTag, createPlaceholderNote]);

    useEffect(() => {
      setSelectedNotes(appState.notes.selectedNotes);
    }, [appState.notes.selectedNotes]);

    useEffect(() => {
      const removeStream = application.streamItems(ContentType.Note, () => {
        reloadNotes();
      });

      return () => {
        removeStream();
      };
    }, [application, reloadNotes]);

    return (
      <div
        id="notes-column"
        className="sn-component section notes"
        aria-label="Notes"
      >
        <div className="content">
          <div id="notes-title-bar" className="section-title-bar">
            <div className="p-4">
              <div className="section-title-bar-header">
                <div className="sk-h2 font-semibold title">{panelTitle}</div>
                <button
                  className="sk-button contrast wide"
                  title="Create a new note in the selected tag"
                  aria-label="Create new note"
                  onClick={() => createNewNote()}
                >
                  <div className="sk-label">
                    <i className="ion-plus add-button" aria-hidden></i>
                  </div>
                </button>
              </div>
              <div className="filter-section" role="search">
                <input
                  type="text"
                  id="search-bar"
                  className="filter-bar"
                  placeholder="Search"
                  title="Searches notes in the currently selected tag"
                  value={noteFilterText}
                  onChange={onNoteFilterTextChange}
                />
                {noteFilterText ? (
                  <div aria-role="button" id="search-clear-button">
                    ✕
                  </div>
                ) : null}
                <div className="ml-2">
                  <SearchOptions
                    application={application}
                    appState={appState}
                  />
                </div>
              </div>
              <NoAccountWarning appState={appState} />
            </div>
            <div id="notes-menu-bar" className="sn-component">
              <div className="sk-app-bar no-edges">
                <div className="left">
                  <div
                    className={`sk-app-bar-item ${
                      showDisplayOptionsMenu ? 'selected' : ''
                    }`}
                    onClick={() =>
                      setShowDisplayOptionsMenu((enabled) => !enabled)
                    }
                  >
                    <div className="sk-app-bar-item-column">
                      <div className="sk-label">Options</div>
                    </div>
                    <div className="sk-app-bar-item-column">
                      <div className="sk-sublabel">{getOptionsSubtitle()}</div>
                    </div>
                  </div>
                </div>
              </div>
              {showDisplayOptionsMenu ? (
                <NotesListOptionsMenu
                  application={application}
                  closeDisplayOptionsMenu={() =>
                    setShowDisplayOptionsMenu(false)
                  }
                />
              ) : null}
            </div>
          </div>
          {completedFullSync && !renderedNotes.length ? (
            <p className="empty-notes-list faded">No notes.</p>
          ) : null}
          {!completedFullSync && !renderedNotes.length ? (
            <p className="empty-notes-list faded">Loading notes...</p>
          ) : null}
          {renderedNotes.length ? (
            <NotesList
              notes={renderedNotes}
              selectedNotes={selectedNotes}
              appState={appState}
              sortBy={displayOptions.sortBy}
              hideDate={displayOptions.hideDate}
              hidePreview={displayOptions.hideNotePreview}
              hideTags={displayOptions.hideTags}
            />
          ) : null}
        </div>
      </div>
    );
  }
);

export const NotesViewDirective = toDirective<Props>(NotesView);
