import { FileItem } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef } from 'react'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'
import ListItemConflictIndicator from './ListItemConflictIndicator'
import ListItemTags from './ListItemTags'
import ListItemMetadata from './ListItemMetadata'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useContextMenuEvent } from '@/Hooks/useContextMenuEvent'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { formatSizeToReadableString } from '@standardnotes/filepicker'

const FileListItem: FunctionComponent<DisplayableListItemProps<FileItem>> = ({
  application,
  filesController,
  hideDate,
  hideIcon,
  hideTags,
  item,
  onSelect,
  selected,
  sortBy,
  tags,
}) => {
  const { toggleAppPane } = useResponsiveAppPane()

  const listItemRef = useRef<HTMLDivElement>(null)

  const openFileContextMenu = useCallback(
    (posX: number, posY: number) => {
      filesController.setShowFileContextMenu(false)
      filesController.setFileContextMenuLocation({
        x: posX,
        y: posY,
      })
      filesController.setShowFileContextMenu(true)
    },
    [filesController],
  )

  const openContextMenu = useCallback(
    async (posX: number, posY: number) => {
      let shouldOpenContextMenu = selected

      if (!selected) {
        const { didSelect } = await onSelect(item)
        if (didSelect) {
          shouldOpenContextMenu = true
        }
      }

      if (shouldOpenContextMenu) {
        openFileContextMenu(posX, posY)
      }
    },
    [selected, onSelect, item, openFileContextMenu],
  )

  const onClick = useCallback(async () => {
    const { didSelect } = await onSelect(item, true)
    if (didSelect) {
      toggleAppPane(AppPaneId.Editor)
    }
  }, [item, onSelect, toggleAppPane])

  const IconComponent = () =>
    getFileIconComponent(
      application.iconsController.getIconForFileType((item as FileItem).mimeType),
      'w-10 h-10 flex-shrink-0',
    )

  useContextMenuEvent(listItemRef, openContextMenu)

  return (
    <div
      ref={listItemRef}
      className={classNames('flex max-h-[300px] w-[180px] cursor-pointer px-1 pt-2 text-text md:w-[200px]')}
      id={item.uuid}
      onClick={onClick}
    >
      <div
        className={`flex flex-col justify-between overflow-hidden rounded bg-passive-5 pt-5 transition-all hover:bg-passive-4 ${
          selected ? 'border-[1px] border-solid border-info' : 'border-[1px] border-solid border-border'
        }`}
      >
        <div className={'px-5'}>
          {!hideIcon ? (
            <div className="mr-0">
              <IconComponent />
            </div>
          ) : (
            <div className="pr-4" />
          )}
          <div className="min-w-0 flex-grow py-4 px-0">
            <div className="line-clamp-2 overflow-hidden text-editor font-semibold">
              <div className="break-word line-clamp-2 mr-2 overflow-hidden">{item.title}</div>
            </div>
            <ListItemMetadata item={item} hideDate={hideDate} sortBy={sortBy} />
            <ListItemTags hideTags={hideTags} tags={tags} />
            <ListItemConflictIndicator item={item} />
          </div>
        </div>
        <div
          className={classNames(
            'border-t-[1px] border-solid border-border p-3 text-xs font-bold',
            selected ? 'bg-info text-info-contrast' : 'bg-passive-4 text-neutral',
          )}
        >
          {formatSizeToReadableString(item.decryptedSize)}
        </div>
      </div>
    </div>
  )
}

export default observer(FileListItem)
