import { KeyboardKey, KeyboardModifier } from '@/Services/IOService'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NOTES } from '@/Constants/Constants'
import { PrefKey, SystemViewId } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import {
  ChangeEventHandler,
  FunctionComponent,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import ContentList from '@/Components/ContentListView/ContentList'
import NoAccountWarning from '@/Components/NoAccountWarning/NoAccountWarning'
import SearchOptions from '@/Components/SearchOptions/SearchOptions'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import ContentListOptionsMenu from './ContentListOptionsMenu'
import Icon from '@/Components/Icon/Icon'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FilesController } from '@/Controllers/FilesController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { NotesController } from '@/Controllers/NotesController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { ElementIds } from '@/Constants/ElementIDs'

type Props = {
  accountMenuController: AccountMenuController
  application: WebApplication
  filesController: FilesController
  itemListController: ItemListController
  navigationController: NavigationController
  noAccountWarningController: NoAccountWarningController
  noteTagsController: NoteTagsController
  notesController: NotesController
  searchOptionsController: SearchOptionsController
  selectionController: SelectedItemsController
}

const ContentListView: FunctionComponent<Props> = ({
  accountMenuController,
  application,
  filesController,
  itemListController,
  navigationController,
  noAccountWarningController,
  noteTagsController,
  notesController,
  searchOptionsController,
  selectionController,
}) => {
  const itemsViewPanelRef = useRef<HTMLDivElement>(null)
  const displayOptionsMenuRef = useRef<HTMLDivElement>(null)

  const {
    completedFullSync,
    noteFilterText,
    optionsSubtitle,
    panelTitle,
    renderedItems,
    setNoteFilterText,
    searchBarElement,
    selectNextItem,
    selectPreviousItem,
    onFilterEnter,
    clearFilterText,
    paginate,
    panelWidth,
    createNewNote,
  } = itemListController

  const { selectedItems } = selectionController

  const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false)
  const [focusedSearch, setFocusedSearch] = useState(false)

  const [closeDisplayOptMenuOnBlur] = useCloseOnBlur(displayOptionsMenuRef, setShowDisplayOptionsMenu)

  const isFilesSmartView = useMemo(
    () => navigationController.selected?.uuid === SystemViewId.Files,
    [navigationController.selected?.uuid],
  )

  const addNewItem = useCallback(() => {
    if (isFilesSmartView) {
      void filesController.uploadNewFile()
    } else {
      void createNewNote()
    }
  }, [filesController, createNewNote, isFilesSmartView])

  useEffect(() => {
    /**
     * In the browser we're not allowed to override cmd/ctrl + n, so we have to
     * use Control modifier as well. These rules don't apply to desktop, but
     * probably better to be consistent.
     */
    const disposeNewNoteKeyObserver = application.io.addKeyObserver({
      key: 'n',
      modifiers: [KeyboardModifier.Meta, KeyboardModifier.Ctrl],
      onKeyDown: (event) => {
        event.preventDefault()
        addNewItem()
      },
    })

    const disposeNextNoteKeyObserver = application.io.addKeyObserver({
      key: KeyboardKey.Down,
      elements: [document.body, ...(searchBarElement ? [searchBarElement] : [])],
      onKeyDown: () => {
        if (searchBarElement === document.activeElement) {
          searchBarElement?.blur()
        }
        selectNextItem()
      },
    })

    const disposePreviousNoteKeyObserver = application.io.addKeyObserver({
      key: KeyboardKey.Up,
      element: document.body,
      onKeyDown: () => {
        selectPreviousItem()
      },
    })

    const disposeSearchKeyObserver = application.io.addKeyObserver({
      key: 'f',
      modifiers: [KeyboardModifier.Meta, KeyboardModifier.Shift],
      onKeyDown: () => {
        if (searchBarElement) {
          searchBarElement.focus()
        }
      },
    })

    const disposeSelectAllKeyObserver = application.io.addKeyObserver({
      key: 'a',
      modifiers: [KeyboardModifier.Ctrl],
      onKeyDown: (event) => {
        const isTargetInsideContentList = (event.target as HTMLElement).closest(`#${ElementIds.ContentList}`)

        if (!isTargetInsideContentList) {
          return
        }

        event.preventDefault()
        selectionController.selectAll()
      },
    })

    return () => {
      disposeNewNoteKeyObserver()
      disposeNextNoteKeyObserver()
      disposePreviousNoteKeyObserver()
      disposeSearchKeyObserver()
      disposeSelectAllKeyObserver()
    }
  }, [
    addNewItem,
    application.io,
    createNewNote,
    searchBarElement,
    selectNextItem,
    selectPreviousItem,
    selectionController,
  ])

  const onNoteFilterTextChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setNoteFilterText(e.target.value)
    },
    [setNoteFilterText],
  )

  const onSearchFocused = useCallback(() => setFocusedSearch(true), [])
  const onSearchBlurred = useCallback(() => setFocusedSearch(false), [])

  const onNoteFilterKeyUp: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === KeyboardKey.Enter) {
        onFilterEnter()
      }
    },
    [onFilterEnter],
  )

  const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      application.setPreference(PrefKey.NotesPanelWidth, width).catch(console.error)
      noteTagsController.reloadTagsContainerMaxWidth()
      application.publishPanelDidResizeEvent(PANEL_NAME_NOTES, isCollapsed)
    },
    [application, noteTagsController],
  )

  const panelWidthEventCallback = useCallback(() => {
    noteTagsController.reloadTagsContainerMaxWidth()
  }, [noteTagsController])

  const toggleDisplayOptionsMenu = useCallback(() => {
    setShowDisplayOptionsMenu(!showDisplayOptionsMenu)
  }, [showDisplayOptionsMenu])

  const addButtonLabel = useMemo(
    () => (isFilesSmartView ? 'Upload file' : 'Create a new note in the selected tag'),
    [isFilesSmartView],
  )

  return (
    <div
      id="items-column"
      className="sn-component section app-column app-column-second"
      aria-label={'Notes & Files'}
      ref={itemsViewPanelRef}
    >
      <div className="content">
        <div id="items-title-bar" className="section-title-bar">
          <div id="items-title-bar-container">
            <div className="section-title-bar-header">
              <div className="sk-h2 font-semibold title">{panelTitle}</div>
              <button
                className="flex items-center px-5 py-1 bg-contrast hover:brightness-130 color-text border-0 cursor-pointer"
                title={addButtonLabel}
                aria-label={addButtonLabel}
                onClick={addNewItem}
              >
                <Icon type="add" className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="filter-section" role="search">
              <div>
                <input
                  type="text"
                  id="search-bar"
                  className="filter-bar"
                  placeholder="Search"
                  title="Searches notes and files in the currently selected tag"
                  value={noteFilterText}
                  onChange={onNoteFilterTextChange}
                  onKeyUp={onNoteFilterKeyUp}
                  onFocus={onSearchFocused}
                  onBlur={onSearchBlurred}
                  autoComplete="off"
                />
                {noteFilterText && (
                  <button onClick={clearFilterText} id="search-clear-button">
                    ✕
                  </button>
                )}
              </div>

              {(focusedSearch || noteFilterText) && (
                <div className="animate-fade-from-top">
                  <SearchOptions application={application} searchOptions={searchOptionsController} />
                </div>
              )}
            </div>
            <NoAccountWarning
              accountMenuController={accountMenuController}
              noAccountWarningController={noAccountWarningController}
            />
          </div>
          <div id="items-menu-bar" className="sn-component" ref={displayOptionsMenuRef}>
            <div className="sk-app-bar no-edges">
              <div className="left">
                <Disclosure open={showDisplayOptionsMenu} onChange={toggleDisplayOptionsMenu}>
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
                      <ContentListOptionsMenu
                        application={application}
                        closeDisplayOptionsMenu={toggleDisplayOptionsMenu}
                        closeOnBlur={closeDisplayOptMenuOnBlur}
                        isOpen={showDisplayOptionsMenu}
                        navigationController={navigationController}
                      />
                    )}
                  </DisclosurePanel>
                </Disclosure>
              </div>
            </div>
          </div>
        </div>
        {completedFullSync && !renderedItems.length ? <p className="empty-items-list faded">No items.</p> : null}
        {!completedFullSync && !renderedItems.length ? <p className="empty-items-list faded">Loading...</p> : null}
        {renderedItems.length ? (
          <ContentList
            items={renderedItems}
            selectedItems={selectedItems}
            application={application}
            paginate={paginate}
            filesController={filesController}
            itemListController={itemListController}
            navigationController={navigationController}
            notesController={notesController}
            selectionController={selectionController}
          />
        ) : null}
      </div>
      {itemsViewPanelRef.current && (
        <PanelResizer
          collapsable={true}
          hoverable={true}
          defaultWidth={300}
          panel={itemsViewPanelRef.current}
          side={PanelSide.Right}
          type={PanelResizeType.WidthOnly}
          resizeFinishCallback={panelResizeFinishCallback}
          widthEventCallback={panelWidthEventCallback}
          width={panelWidth}
          left={0}
        />
      )}
    </div>
  )
}

export default observer(ContentListView)
