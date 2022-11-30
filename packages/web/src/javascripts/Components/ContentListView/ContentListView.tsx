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
import { FileItem, PrefKey, WebAppEvent } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react'
import ContentList from '@/Components/ContentListView/ContentList'
import NoAccountWarning from '@/Components/NoAccountWarning/NoAccountWarning'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import { FilesController } from '@/Controllers/FilesController'
import { NoAccountWarningController } from '@/Controllers/NoAccountWarningController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { AccountMenuController } from '@/Controllers/AccountMenu/AccountMenuController'
import { ElementIds } from '@/Constants/ElementIDs'
import ContentListHeader from './Header/ContentListHeader'
import { AppPaneId } from '../Panes/AppPaneMetadata'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { StreamingFileReader } from '@standardnotes/filepicker'
import SearchBar from '../SearchBar/SearchBar'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { classNames } from '@standardnotes/utils'
import { useFileDragNDrop } from '../FileDragNDropProvider'
import { LinkingController } from '@/Controllers/LinkingController'
import DailyContentList from './Daily/DailyContentList'
import { ListableContentItem } from './Types/ListableContentItem'
import { FeatureName } from '@/Controllers/FeatureName'
import { PanelResizedData } from '@/Types/PanelResizedData'
import { useForwardedRef } from '@/Hooks/useForwardedRef'

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
  className?: string
  id: string
  children?: React.ReactNode
  onPanelWidthLoad: (width: number) => void
}

const ContentListView = forwardRef<HTMLDivElement, Props>(
  (
    {
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
      className,
      id,
      children,
      onPanelWidthLoad,
    },
    ref,
  ) => {
    const { toggleAppPane, panes } = useResponsiveAppPane()
    const { selectedUuids, selectNextItem, selectPreviousItem } = selectionController
    const { selected: selectedTag, selectedAsTag } = navigationController
    const {
      completedFullSync,
      createNewNote,
      optionsSubtitle,
      paginate,
      panelTitle,
      renderedItems,
      items,
      isCurrentNoteTemplate,
    } = itemListController

    const fileInputRef = useRef<HTMLInputElement>(null)
    const innerRef = useForwardedRef(ref)

    const { addDragTarget, removeDragTarget } = useFileDragNDrop()

    useEffect(() => {
      return application.addWebEventObserver((event, data) => {
        if (event === WebAppEvent.PanelResized) {
          const { panel, width } = data as PanelResizedData
          if (panel === PANEL_NAME_NOTES) {
            if (selectedAsTag) {
              void navigationController.setPanelWidthForTag(selectedAsTag, width)
            } else {
              void application.setPreference(PrefKey.NotesPanelWidth, width).catch(console.error)
            }
          }
        }
      })
    }, [application, navigationController, selectedAsTag])

    useEffect(() => {
      const panelWidth = selectedTag?.preferences?.panelWidth || application.getPreference(PrefKey.NotesPanelWidth)
      if (panelWidth) {
        onPanelWidthLoad(panelWidth)
      }
    }, [selectedTag, application, onPanelWidthLoad])

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
      const target = innerRef.current
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
    }, [
      addDragTarget,
      fileDropCallback,
      navigationController,
      navigationController.selected,
      removeDragTarget,
      innerRef,
    ])

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
    }, [
      addNewItem,
      application.keyboardService,
      createNewNote,
      selectNextItem,
      selectPreviousItem,
      selectionController,
    ])

    const shortcutForCreate = useMemo(
      () => application.keyboardService.keyboardShortcutForCommand(CREATE_NEW_NOTE_KEYBOARD_COMMAND),
      [application],
    )

    const addButtonLabel = useMemo(() => {
      return isFilesSmartView
        ? 'Upload file'
        : `Create a new note in the selected tag (${shortcutForCreate && keyboardStringForShortcut(shortcutForCreate)})`
    }, [isFilesSmartView, shortcutForCreate])

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
      const hasEditorPane = panes.includes(AppPaneId.Editor)
      if (!hasEditorPane) {
        innerRef.current?.style.removeProperty('width')
      }
    }, [selectedUuids, innerRef, isCurrentNoteTemplate, renderedItems, panes])

    return (
      <div
        id={id}
        className={classNames(className, 'sn-component section h-full overflow-hidden pt-safe-top')}
        aria-label={'Notes & Files'}
        ref={innerRef}
      >
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
        {!dailyMode && completedFullSync && !renderedItems.length ? (
          <p className="empty-items-list opacity-50">No items.</p>
        ) : null}

        {!dailyMode && !completedFullSync && !renderedItems.length ? (
          <p className="empty-items-list opacity-50">Loading...</p>
        ) : null}

        {!dailyMode && renderedItems.length ? (
          <>
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
        {children}
      </div>
    )
  },
)

export default observer(ContentListView)
