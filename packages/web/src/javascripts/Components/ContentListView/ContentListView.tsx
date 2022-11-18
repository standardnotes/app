import {
  CANCEL_SEARCH_COMMAND,
  CREATE_NEW_NOTE_KEYBOARD_COMMAND,
  keyboardStringForShortcut,
  NEXT_LIST_ITEM_KEYBOARD_COMMAND,
  PREVIOUS_LIST_ITEM_KEYBOARD_COMMAND,
  SEARCH_KEYBOARD_COMMAND,
  SELECT_ALL_ITEMS_KEYBOARD_COMMAND,
} from '@standardnotes/ui-services'
import { WebApplication } from '@/Application/Application'
import { PANEL_NAME_NOTES } from '@/Constants/Constants'
import { FileItem, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react'
import ContentList from '@/Components/ContentListView/ContentList'
import NoAccountWarning from '@/Components/NoAccountWarning/NoAccountWarning'
import PanelResizer, { PanelSide, ResizeFinishCallback, PanelResizeType } from '@/Components/PanelResizer/PanelResizer'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FilesController } from '@/Controllers/FilesController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { ElementIds } from '@/Constants/ElementIDs'
import ContentListHeader from './Header/ContentListHeader'
import ResponsivePaneContent from '../ResponsivePane/ResponsivePaneContent'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { StreamingFileReader } from '@standardnotes/filepicker'
import SearchBar from '../SearchBar/SearchBar'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useFileDragNDrop } from '../FileDragNDropProvider/FileDragNDropProvider'
import { LinkingController } from '@/Controllers/LinkingController'
import DailyContentList from './Daily/DailyContentList'
import { ListableContentItem } from './Types/ListableContentItem'
import { FeatureName } from '@/Controllers/FeatureName'

type Props = {
  accountMenuController: AccountMenuController
  application: WebApplication
  filesController: FilesController
  itemListController: ItemListController
  navigationController: NavigationController
  noAccountWarningController: NoAccountWarningController
  notesController: NotesController
  selectionController: SelectedItemsController
  searchOptionsController: SearchOptionsController
  linkingController: LinkingController
}

const ContentListView: FunctionComponent<Props> = ({
  accountMenuController,
  application,
  filesController,
  itemListController,
  navigationController,
  noAccountWarningController,
  notesController,
  selectionController,
  searchOptionsController,
  linkingController,
}) => {
  const { isNotesListVisibleOnTablets, toggleAppPane } = useResponsiveAppPane()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsViewPanelRef = useRef<HTMLDivElement>(null)

  const { addDragTarget, removeDragTarget } = useFileDragNDrop()

  const fileDropCallback = useCallback(
    async (files: FileItem[]) => {
      const currentTag = navigationController.selected

      if (!currentTag) {
        return
      }

      if (navigationController.isInAnySystemView() || navigationController.isInSmartView()) {
        console.error('Trying to link uploaded files to smart view')
        return
      }

      files.forEach(async (file) => {
        await linkingController.linkItems(file, currentTag)
      })
    },
    [navigationController, linkingController],
  )

  useEffect(() => {
    const target = itemsViewPanelRef.current
    const currentTag = navigationController.selected
    const shouldAddDropTarget = !navigationController.isInAnySystemView() && !navigationController.isInSmartView()

    if (target && shouldAddDropTarget && currentTag) {
      addDragTarget(target, {
        tooltipText: `Drop your files to upload and link them to tag "${currentTag.title}"`,
        callback: fileDropCallback,
      })
    }

    return () => {
      if (target) {
        removeDragTarget(target)
      }
    }
  }, [addDragTarget, fileDropCallback, navigationController, navigationController.selected, removeDragTarget])

  const {
    completedFullSync,
    createNewNote,
    optionsSubtitle,
    paginate,
    panelTitle,
    panelWidth,
    renderedItems,
    items,
    isCurrentNoteTemplate,
  } = itemListController

  const { selectedUuids, selectNextItem, selectPreviousItem } = selectionController

  const { selected: selectedTag, selectedAsTag } = navigationController

  const icon = selectedTag?.iconString

  const isFilesSmartView = useMemo(() => navigationController.isInFilesView, [navigationController.isInFilesView])

  const addNewItem = useCallback(async () => {
    if (isFilesSmartView) {
      if (!application.entitledToFiles) {
        application.showPremiumModal(FeatureName.Files)
        return
      }

      if (StreamingFileReader.available()) {
        void filesController.uploadNewFile()
        return
      }

      fileInputRef.current?.click()
    } else {
      await createNewNote()
      toggleAppPane(AppPaneId.Editor)
    }
  }, [isFilesSmartView, filesController, createNewNote, toggleAppPane, application])

  useEffect(() => {
    const searchBarElement = document.getElementById(ElementIds.SearchBar)
    /**
     * In the browser we're not allowed to override cmd/ctrl + n, so we have to
     * use Control modifier as well. These rules don't apply to desktop, but
     * probably better to be consistent.
     */
    return application.keyboardService.addCommandHandlers([
      {
        command: CREATE_NEW_NOTE_KEYBOARD_COMMAND,
        onKeyDown: (event) => {
          event.preventDefault()
          void addNewItem()
        },
      },
      {
        command: NEXT_LIST_ITEM_KEYBOARD_COMMAND,
        elements: [document.body, ...(searchBarElement ? [searchBarElement] : [])],
        onKeyDown: () => {
          if (searchBarElement === document.activeElement) {
            searchBarElement?.blur()
          }
          selectNextItem()
        },
      },
      {
        command: PREVIOUS_LIST_ITEM_KEYBOARD_COMMAND,
        element: document.body,
        onKeyDown: () => {
          selectPreviousItem()
        },
      },
      {
        command: SEARCH_KEYBOARD_COMMAND,
        onKeyDown: (event) => {
          if (searchBarElement) {
            event.preventDefault()
            searchBarElement.focus()
          }
        },
      },
      {
        command: CANCEL_SEARCH_COMMAND,
        onKeyDown: () => {
          if (searchBarElement) {
            searchBarElement.blur()
          }
        },
      },
      {
        command: SELECT_ALL_ITEMS_KEYBOARD_COMMAND,
        onKeyDown: (event) => {
          const isTargetInsideContentList = (event.target as HTMLElement).closest(`#${ElementIds.ContentList}`)

          if (!isTargetInsideContentList) {
            return
          }

          event.preventDefault()
          selectionController.selectAll()
        },
      },
    ])
  }, [addNewItem, application.keyboardService, createNewNote, selectNextItem, selectPreviousItem, selectionController])

  const panelResizeFinishCallback: ResizeFinishCallback = useCallback(
    (width, _lastLeft, _isMaxWidth, isCollapsed) => {
      if (selectedAsTag) {
        void navigationController.setPanelWidthForTag(selectedAsTag, width)
      } else {
        void application.setPreference(PrefKey.NotesPanelWidth, width).catch(console.error)
      }
      application.publishPanelDidResizeEvent(PANEL_NAME_NOTES, isCollapsed)
    },
    [application, selectedAsTag, navigationController],
  )

  const shortcutForCreate = useMemo(
    () => application.keyboardService.keyboardShortcutForCommand(CREATE_NEW_NOTE_KEYBOARD_COMMAND),
    [application],
  )

  const addButtonLabel = useMemo(() => {
    return isFilesSmartView
      ? 'Upload file'
      : `Create a new note in the selected tag (${shortcutForCreate && keyboardStringForShortcut(shortcutForCreate)})`
  }, [isFilesSmartView, shortcutForCreate])

  const matchesMediumBreakpoint = useMediaQuery(MediaQueryBreakpoints.md)
  const matchesXLBreakpoint = useMediaQuery(MediaQueryBreakpoints.xl)
  const isTabletScreenSize = matchesMediumBreakpoint && !matchesXLBreakpoint

  const dailyMode = selectedAsTag?.isDailyEntry

  const handleDailyListSelection = useCallback(
    async (item: ListableContentItem, userTriggered: boolean) => {
      await selectionController.selectItemWithScrollHandling(item, {
        userTriggered: true,
        scrollIntoView: userTriggered === false,
        animated: false,
      })
    },
    [selectionController],
  )

  useEffect(() => {
    const hasEditorPane = selectedUuids.size > 0 || renderedItems.length === 0 || isCurrentNoteTemplate
    if (!hasEditorPane) {
      itemsViewPanelRef.current?.style.removeProperty('width')
    }
  }, [selectedUuids, itemsViewPanelRef, isCurrentNoteTemplate, renderedItems])

  const hasEditorPane = selectedUuids.size > 0 || renderedItems.length === 0 || isCurrentNoteTemplate

  return (
    <div
      id="items-column"
      className={classNames(
        'sn-component section app-column flex h-full flex-col overflow-hidden pt-safe-top',
        hasEditorPane ? 'xl:w-[24rem] xsm-only:!w-full sm-only:!w-full' : 'w-full md:min-w-[400px]',
        hasEditorPane
          ? isTabletScreenSize && !isNotesListVisibleOnTablets
            ? 'pointer-coarse:md-only:!w-0 pointer-coarse:lg-only:!w-0'
            : 'pointer-coarse:md-only:!w-60 pointer-coarse:lg-only:!w-60'
          : '',
      )}
      aria-label={'Notes & Files'}
      ref={itemsViewPanelRef}
    >
      <ResponsivePaneContent className="overflow-hidden" paneId={AppPaneId.Items}>
        <div id="items-title-bar" className="section-title-bar border-b border-solid border-border">
          <div id="items-title-bar-container">
            <input
              type="file"
              className="absolute top-0 left-0 -z-50 h-px w-px opacity-0"
              multiple
              ref={fileInputRef}
              onChange={(event) => {
                const files = event.currentTarget.files

                if (!files) {
                  return
                }

                for (let i = 0; i < files.length; i++) {
                  void filesController.uploadNewFile(files[i])
                }
              }}
            />
            {selectedTag && (
              <ContentListHeader
                application={application}
                panelTitle={panelTitle}
                icon={icon}
                addButtonLabel={addButtonLabel}
                addNewItem={addNewItem}
                isFilesSmartView={isFilesSmartView}
                optionsSubtitle={optionsSubtitle}
                selectedTag={selectedTag}
              />
            )}
            <SearchBar itemListController={itemListController} searchOptionsController={searchOptionsController} />
            <NoAccountWarning
              accountMenuController={accountMenuController}
              noAccountWarningController={noAccountWarningController}
            />
          </div>
        </div>
        {selectedAsTag && dailyMode && (
          <DailyContentList
            items={items}
            selectedTag={selectedAsTag}
            selectedUuids={selectedUuids}
            itemListController={itemListController}
            onSelect={handleDailyListSelection}
          />
        )}
        {!dailyMode && renderedItems.length ? (
          <>
            {completedFullSync && !renderedItems.length ? (
              <p className="empty-items-list opacity-50">No items.</p>
            ) : null}
            {!completedFullSync && !renderedItems.length ? (
              <p className="empty-items-list opacity-50">Loading...</p>
            ) : null}
            <ContentList
              items={renderedItems}
              selectedUuids={selectedUuids}
              application={application}
              paginate={paginate}
              filesController={filesController}
              itemListController={itemListController}
              navigationController={navigationController}
              notesController={notesController}
              selectionController={selectionController}
            />
          </>
        ) : null}
        <div className="absolute bottom-0 h-safe-bottom w-full" />
      </ResponsivePaneContent>
      {hasEditorPane && itemsViewPanelRef.current && (
        <PanelResizer
          collapsable={true}
          hoverable={true}
          defaultWidth={300}
          panel={itemsViewPanelRef.current}
          side={PanelSide.Right}
          type={PanelResizeType.WidthOnly}
          resizeFinishCallback={panelResizeFinishCallback}
          width={panelWidth}
          left={0}
        />
      )}
    </div>
  )
}

export default observer(ContentListView)
