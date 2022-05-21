import { FileItem } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useCallback } from 'preact/hooks'
import { getFileIconComponent } from '../AttachedFilesPopover/PopoverFileItem'
import { ListItemConflictIndicator } from './ListItemConflictIndicator'
import { ListItemFlagIcons } from './ListItemFlagIcons'
import { ListItemTags } from './ListItemTags'
import { ListItemTimestamps } from './ListItemTimestamps'
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
        void appState.contentListView.selectItemWithScrollHandling(item, true, false)
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

    return (
      <div
        className={`content-list-item flex items-stretch w-full cursor-pointer hover:bg-grey-5 ${
          selected && 'selected bg-grey-5 border-0 border-l-2px border-solid border-info'
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
            {getFileIconComponent(
              application.iconsController.getIconForFileType((item as FileItem).mimeType),
              'w-5 h-5 flex-shrink-0',
            )}
          </div>
        )}
        <div className="flex-grow min-w-0 py-4 px-0 border-0 border-b-1 border-solid border-main">
          <div className="flex items-start justify-between font-semibold text-base leading-1.3 overflow-hidden">
            <div className="break-word mr-2">{item.title}</div>
          </div>
          <ListItemTimestamps item={item} hideDate={hideDate} sortBy={sortBy} />
          <ListItemTags hideTags={hideTags} tags={tags} />
          <ListItemConflictIndicator item={item} />
        </div>
        <ListItemFlagIcons item={item} />
      </div>
    )
  },
)
