import { FileItem } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback } from 'preact/hooks'
import { getFileIconComponent } from '../AttachedFilesPopover/PopoverFileItem'
import { ListItemConflictIndicator } from './ListItemConflictIndicator'
import { ListItemFlagIcons } from './ListItemFlagIcons'
import { ListItemTags } from './ListItemTags'
import { ListItemMetadata } from './ListItemMetadata'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'

export const FileListItem: FunctionComponent<DisplayableListItemProps> = observer(
  ({ application, appState, hideDate, hideIcon, hideTags, item, selected, sortBy, tags }) => {
    const openFileContextMenu = useCallback(
      (posX: number, posY: number) => {
        appState.files.setFileContextMenuLocation({
          x: posX,
          y: posY,
        })
        appState.files.setShowFileContextMenu(true)
      },
      [appState.files],
    )

    const openContextMenu = useCallback(
      (posX: number, posY: number) => {
        void appState.contentListView.selectItemWithScrollHandling(
          {
            uuid: item.uuid,
          },
          {
            userTriggered: true,
            scrollIntoView: false,
          },
        )
        openFileContextMenu(posX, posY)
      },
      [appState.contentListView, item, openFileContextMenu],
    )

    const onClick = useCallback(() => {
      void appState.selectedItems.selectItem(item.uuid, true).then(() => {
        if (appState.selectedItems.selectedItemsCount < 2) {
          appState.filePreviewModal.activate(item as FileItem, appState.files.allFiles)
        }
      })
    }, [appState.filePreviewModal, appState.files.allFiles, appState.selectedItems, item])

    const IconComponent = () =>
      getFileIconComponent(
        application.iconsController.getIconForFileType((item as FileItem).mimeType),
        'w-5 h-5 flex-shrink-0',
      )

    return (
      <div
        className={`content-list-item flex items-stretch w-full cursor-pointer ${
          selected && 'selected border-0 border-l-2px border-solid border-info'
        }`}
        id={item.uuid}
        onClick={onClick}
        onContextMenu={(event) => {
          event.preventDefault()
          openContextMenu(event.clientX, event.clientY)
        }}
      >
        {!hideIcon && (
          <div className="flex flex-col items-center justify-between p-4 pr-3 mr-0">
            <IconComponent />
          </div>
        )}
        <div className="flex-grow min-w-0 py-4 px-0 border-0 border-b-1 border-solid border-main">
          <div className="flex items-start justify-between font-semibold text-base leading-1.3 overflow-hidden">
            <div className="break-word mr-2">{item.title}</div>
          </div>
          {(!hideDate || item.protected) && (
            <ListItemMetadata
              item={{
                protected: item.protected,
                updatedAtString: item.updatedAtString,
                createdAtString: item.createdAtString,
              }}
              hideDate={hideDate}
              sortBy={sortBy}
            />
          )}
          {!hideTags && <ListItemTags tags={tags} />}
          {item.conflictOf && <ListItemConflictIndicator />}
        </div>
        <ListItemFlagIcons
          item={{
            archived: item.archived,
            locked: item.locked,
            pinned: item.pinned,
            trashed: item.trashed,
          }}
        />
      </div>
    )
  },
)
