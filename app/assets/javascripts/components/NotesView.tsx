import {
  PanelSide,
  ResizeFinishCallback,
} from '@/directives/views/panelResizer';
import { KeyboardKey, KeyboardModifier } from '@/services/ioService';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PANEL_NAME_NOTES } from '@/views/constants';
import { PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { NoAccountWarning } from './NoAccountWarning';
import { NotesList } from './NotesList';
import { NotesListOptionsMenu } from './NotesListOptionsMenu';
import { PanelResizer } from './PanelResizer';
import { SearchOptions } from './SearchOptions';
import { toDirective } from './utils';

type Props = {
  application: WebApplication;
  appState: AppState;
};

const NotesView: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const notesViewPanelRef = useRef<HTMLDivElement>(null);

    const {
      completedFullSync,
      createNewNote,
      displayOptions,
      noteFilterText,
      optionsSubtitle,
      panelTitle,
      renderedNotes,
      selectedNotes,
      setNoteFilterText,
      showDisplayOptionsMenu,
      toggleDisplayOptionsMenu,
      searchBarElement,
      selectNextNote,
      selectPreviousNote,
      onFilterEnter,
      handleFilterTextChanged,
      onSearchInputBlur,
      clearFilterText,
      paginate,
    } = appState.notesView;

    useEffect(() => {
      handleFilterTextChanged();
    }, [noteFilterText, handleFilterTextChanged]);

    useEffect(() => {
      /**
       * In the browser we're not allowed to override cmd/ctrl + n, so we have to
       * use Control modifier as well. These rules don't apply to desktop, but
       * probably better to be consistent.
       */
      const newNoteKeyObserver = application.io.addKeyObserver({
        key: 'n',
        modifiers: [KeyboardModifier.Meta, KeyboardModifier.Ctrl],
        onKeyDown: (event) => {
          event.preventDefault();
          createNewNote();
        },
      });

      const nextNoteKeyObserver = application.io.addKeyObserver({
        key: KeyboardKey.Down,
        elements: [
          document.body,
          ...(searchBarElement ? [searchBarElement] : []),
        ],
        onKeyDown: () => {
          if (searchBarElement === document.activeElement) {
            searchBarElement?.blur();
          }
          selectNextNote();
        },
      });

      const previousNoteKeyObserver = application.io.addKeyObserver({
        key: KeyboardKey.Up,
        element: document.body,
        onKeyDown: () => {
          selectPreviousNote();
        },
      });

      const searchKeyObserver = application.io.addKeyObserver({
        key: 'f',
        modifiers: [KeyboardModifier.Meta, KeyboardModifier.Shift],
        onKeyDown: () => {
          if (searchBarElement) {
            searchBarElement.focus();
          }
        },
      });

      return () => {
        newNoteKeyObserver();
        nextNoteKeyObserver();
        previousNoteKeyObserver();
        searchKeyObserver();
      };
    }, [
      application.io,
      createNewNote,
      searchBarElement,
      selectNextNote,
      selectPreviousNote,
    ]);

    const onNoteFilterTextChange = (e: Event) => {
      setNoteFilterText((e.target as HTMLInputElement).value);
    };

    const onNoteFilterKeyUp = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Enter) {
        onFilterEnter();
      }
    };

    const panelResizeFinishCallback: ResizeFinishCallback = (
      _lastWidth,
      _lastLeft,
      _isMaxWidth,
      isCollapsed
    ) => {
      appState.noteTags.reloadTagsContainerMaxWidth();
      appState.panelDidResize(PANEL_NAME_NOTES, isCollapsed);
    };

    const panelWidthEventCallback = () => {
      appState.noteTags.reloadTagsContainerMaxWidth();
    };

    return (
      <div
        id="notes-column"
        className="sn-component section notes"
        aria-label="Notes"
        ref={notesViewPanelRef}
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
                  onKeyUp={onNoteFilterKeyUp}
                  onBlur={() => onSearchInputBlur()}
                />
                {noteFilterText ? (
                  <button
                    onClick={clearFilterText}
                    aria-role="button"
                    id="search-clear-button"
                  >
                    ✕
                  </button>
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
                      toggleDisplayOptionsMenu(!showDisplayOptionsMenu)
                    }
                  >
                    <div className="sk-app-bar-item-column">
                      <div className="sk-label">Options</div>
                    </div>
                    <div className="sk-app-bar-item-column">
                      <div className="sk-sublabel">{optionsSubtitle}</div>
                    </div>
                  </div>
                </div>
              </div>
              {showDisplayOptionsMenu && (
                <NotesListOptionsMenu
                  application={application}
                  closeDisplayOptionsMenu={() =>
                    toggleDisplayOptionsMenu(false)
                  }
                />
              )}
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
              application={application}
              appState={appState}
              displayOptions={displayOptions}
              paginate={paginate}
            />
          ) : null}
        </div>
        {notesViewPanelRef.current && (
          <PanelResizer
            application={application}
            collapsable={true}
            defaultWidth={300}
            panel={document.querySelector('notes-view') as HTMLDivElement}
            prefKey={PrefKey.NotesPanelWidth}
            side={PanelSide.Right}
            resizeFinishCallback={panelResizeFinishCallback}
            widthEventCallback={panelWidthEventCallback}
          />
        )}
      </div>
    );
  }
);

export const NotesViewDirective = toDirective<Props>(NotesView);
