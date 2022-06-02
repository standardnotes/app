import { FileItem } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback } from 'react'
import { getFileIconComponent } from '../AttachedFilesPopover/getFileIconComponent'
import ListItemConflictIndicator from './ListItemConflictIndicator'
import ListItemFlagIcons from './ListItemFlagIcons'
import ListItemTags from './ListItemTags'
import ListItemMetadata from './ListItemMetadata'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'

const FileListItem: FunctionComponent<DisplayableListItemProps> = ({
  application,
  viewControllerManager,
  hideDate,
  hideIcon,
  hideTags,
  item,
  selected,
  sortBy,
  tags,
}) => {
  const openFileContextMenu = useCallback(
    (posX: number, posY: number) => {
      viewControllerManager.filesController.setFileContextMenuLocation({
        x: posX,
        y: posY,
      })
      viewControllerManager.filesController.setShowFileContextMenu(true)
    },
    [viewControllerManager.filesController],
  )

  const openContextMenu = useCallback(
    async (posX: number, posY: number) => {
      const { didSelect } = await viewControllerManager.selectionController.selectItem(item.uuid)
      if (didSelect) {
        openFileContextMenu(posX, posY)
      }
    },
    [viewControllerManager.selectionController, item.uuid, openFileContextMenu],
  )

  const onClick = useCallback(() => {
    void viewControllerManager.selectionController.selectItem(item.uuid, true).then(({ didSelect }) => {
      if (didSelect && viewControllerManager.selectionController.selectedItemsCount < 2) {
        viewControllerManager.filePreviewModalController.activate(
          item as FileItem,
          viewControllerManager.filesController.allFiles,
        )
      }
    })
  }, [
    viewControllerManager.filePreviewModalController,
    viewControllerManager.filesController.allFiles,
    viewControllerManager.selectionController,
    item,
  ])

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
        void openContextMenu(event.clientX, event.clientY)
      }}
    >
      {!hideIcon ? (
        <div className="flex flex-col items-center justify-between p-4.5 pr-3 mr-0">
          <IconComponent />
        </div>
      ) : (
        <div className="pr-4" />
      )}
      <div className="flex-grow min-w-0 py-4 px-0 border-0 border-b-1 border-solid border-main">
        <div className="flex items-start justify-between font-semibold text-base leading-1.3 overflow-hidden">
          <div className="break-word mr-2">{item.title}</div>
        </div>
        <ListItemMetadata item={item} hideDate={hideDate} sortBy={sortBy} />
        <ListItemTags hideTags={hideTags} tags={tags} />
        <ListItemConflictIndicator item={item} />
      </div>
      <ListItemFlagIcons item={item} />
    </div>
  )
}

export default observer(FileListItem)
