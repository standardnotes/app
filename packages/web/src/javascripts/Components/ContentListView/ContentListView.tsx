import { KeyboardKey, KeyboardModifier } from '@/Services/IOService'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NOTES } from '@/Constants/Constants'
import { PrefKey, SystemViewId } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react'
import ContentList from '@/Components/ContentListView/ContentList'
import NoAccountWarning from '@/Components/NoAccountWarning/NoAccountWarning'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FilesController } from '@/Controllers/FilesController'
import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { NotesController } from '@/Controllers/NotesController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { ElementIds } from '@/Constants/ElementIDs'
import ContentListHeader from './Header/ContentListHeader'
import ResponsivePaneContent from '../ResponsivePane/ResponsivePaneContent'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'

type Props = {
  accountMenuController: AccountMenuController
  application: WebApplication
  filesController: FilesController
  itemListController: ItemListController
  navigationController: NavigationController
  noAccountWarningController: NoAccountWarningController
  noteTagsController: NoteTagsController
  notesController: NotesController
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
  selectionController,
}) => {
  const itemsViewPanelRef = useRef<HTMLDivElement>(null)

  const {
    completedFullSync,
    createNewNote,
    optionsSubtitle,
    paginate,
    panelTitle,
    panelWidth,
    renderedItems,
    searchBarElement,
    selectNextItem,
    selectPreviousItem,
  } = itemListController

  const { selectedItems } = selectionController

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

  const addButtonLabel = useMemo(
    () => (isFilesSmartView ? 'Upload file' : 'Create a new note in the selected tag'),
    [isFilesSmartView],
  )

  return (
    <div
      id="items-column"
      className="sn-component section app-column app-column-second border-b border-solid border-border"
      aria-label={'Notes & Files'}
      ref={itemsViewPanelRef}
    >
      <ResponsivePaneContent paneId={AppPaneId.Items}>
        <div id="items-title-bar" className="section-title-bar border-b border-solid border-border">
          <div id="items-title-bar-container">
            <ContentListHeader
              application={application}
              panelTitle={panelTitle}
              addButtonLabel={addButtonLabel}
              addNewItem={addNewItem}
              isFilesSmartView={isFilesSmartView}
              optionsSubtitle={optionsSubtitle}
            />
            <NoAccountWarning
              accountMenuController={accountMenuController}
              noAccountWarningController={noAccountWarningController}
            />
          </div>
        </div>
        {completedFullSync && !renderedItems.length ? <p className="empty-items-list opacity-50">No items.</p> : null}
        {!completedFullSync && !renderedItems.length ? <p className="empty-items-list opacity-50">Loading...</p> : null}
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
      </ResponsivePaneContent>
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
