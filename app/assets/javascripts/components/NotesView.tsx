import { KeyboardKey, KeyboardModifier } from '@/services/ioService';
import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { PANEL_NAME_NOTES } from '@/constants';
import { PrefKey } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { NoAccountWarning } from './NoAccountWarning';
import { NotesList } from './NotesList';
import { NotesListOptionsMenu } from './NotesListOptionsMenu';
import { SearchOptions } from './SearchOptions';
import {
  PanelSide,
  ResizeFinishCallback,
  PanelResizer,
  PanelResizeType,
} from './PanelResizer';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { useCloseOnBlur } from './utils';

type Props = {
  application: WebApplication;
  appState: AppState;
};

export const NotesView: FunctionComponent<Props> = observer(
  ({ application, appState }) => {
    const notesViewPanelRef = useRef<HTMLDivElement>(null);
    const displayOptionsMenuRef = useRef<HTMLDivElement>(null);

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
      searchBarElement,
      selectNextNote,
      selectPreviousNote,
      onFilterEnter,
      handleFilterTextChanged,
      clearFilterText,
      paginate,
      panelWidth,
    } = appState.notesView;

    const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false);
    const [focusedSearch, setFocusedSearch] = useState(false);

    const [closeDisplayOptMenuOnBlur] = useCloseOnBlur(
      displayOptionsMenuRef,
      setShowDisplayOptionsMenu
    );

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

    const onSearchFocused = () => setFocusedSearch(true);
    const onSearchBlurred = () => setFocusedSearch(false);

    const onNoteFilterKeyUp = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.Enter) {
        onFilterEnter();
      }
    };

    const panelResizeFinishCallback: ResizeFinishCallback = (
      width,
      _lastLeft,
      _isMaxWidth,
      isCollapsed
    ) => {
      application.setPreference(PrefKey.NotesPanelWidth, width);
      appState.noteTags.reloadTagsContainerMaxWidth();
      appState.panelDidResize(PANEL_NAME_NOTES, isCollapsed);
    };

    const panelWidthEventCallback = () => {
      appState.noteTags.reloadTagsContainerMaxWidth();
    };

    const toggleDisplayOptionsMenu = () => {
      setShowDisplayOptionsMenu(!showDisplayOptionsMenu);
    };

    return (
      <div
        id="notes-column"
        className="sn-component section notes app-column app-column-second"
        aria-label="Notes"
        ref={notesViewPanelRef}
      >
        <div className="content">
          <div id="notes-title-bar" className="section-title-bar">
            <div id="notes-title-bar-container">
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
                <div>
                  <input
                    type="text"
                    id="search-bar"
                    className="filter-bar"
                    placeholder="Search"
                    title="Searches notes in the currently selected tag"
                    value={noteFilterText}
                    onChange={onNoteFilterTextChange}
                    onKeyUp={onNoteFilterKeyUp}
                    onFocus={onSearchFocused}
                    onBlur={onSearchBlurred}
                    autocomplete="off"
                  />
                  {noteFilterText && (
                    <button
                      onClick={clearFilterText}
                      aria-role="button"
                      id="search-clear-button"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {(focusedSearch || noteFilterText) && (
                  <div className="animate-fade-from-top">
                    <SearchOptions
                      application={application}
                      appState={appState}
                    />
                  </div>
                )}
              </div>
              <NoAccountWarning appState={appState} />
            </div>
            <div
              id="notes-menu-bar"
              className="sn-component"
              ref={displayOptionsMenuRef}
            >
              <div className="sk-app-bar no-edges">
                <div className="left">
                  <Disclosure
                    open={showDisplayOptionsMenu}
                    onChange={toggleDisplayOptionsMenu}
                  >
                    <DisclosureButton
                      className={`sk-app-bar-item bg-contrast color-text border-0 focus:shadow-none ${
                        showDisplayOptionsMenu ? 'selected' : ''
                      }`}
                      onBlur={closeDisplayOptMenuOnBlur}
                    >
                      <div className="sk-app-bar-item-column">
                        <div className="sk-label">Options</div>
                      </div>
                      <div className="sk-app-bar-item-column">
                        <div className="sk-sublabel">{optionsSubtitle}</div>
                      </div>
                    </DisclosureButton>
                    <DisclosurePanel onBlur={closeDisplayOptMenuOnBlur}>
                      {showDisplayOptionsMenu && (
                        <NotesListOptionsMenu
                          application={application}
                          closeDisplayOptionsMenu={toggleDisplayOptionsMenu}
                          closeOnBlur={closeDisplayOptMenuOnBlur}
                          isOpen={showDisplayOptionsMenu}
                        />
                      )}
                    </DisclosurePanel>
                  </Disclosure>
                </div>
              </div>
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
            collapsable={true}
            hoverable={true}
            defaultWidth={300}
            panel={notesViewPanelRef.current}
            side={PanelSide.Right}
            type={PanelResizeType.WidthOnly}
            resizeFinishCallback={panelResizeFinishCallback}
            widthEventCallback={panelWidthEventCallback}
            width={panelWidth}
            left={0}
          />
        )}
      </div>
    );
  }
);
