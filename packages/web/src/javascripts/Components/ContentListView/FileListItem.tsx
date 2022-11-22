import { FileItem, FileBackupRecord } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
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
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { useApplication } from '../ApplicationView/ApplicationProvider'
import Icon from '../Icon/Icon'

const FileListItem: FunctionComponent<DisplayableListItemProps<FileItem>> = ({
  filesController,
  hideDate,
  hideIcon,
  hideTags,
  item: file,
  onSelect,
  selected,
  sortBy,
  tags,
}) => {
  const { toggleAppPane } = useResponsiveAppPane()
  const application = useApplication()

  const [backupInfo, setBackupInfo] = useState<FileBackupRecord | undefined>(undefined)

  useEffect(() => {
    void application.fileBackups?.getFileBackupInfo(file).then(setBackupInfo)
  }, [application, file])

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
        const { didSelect } = await onSelect(file)
        if (didSelect) {
          shouldOpenContextMenu = true
        }
      }

      if (shouldOpenContextMenu) {
        openFileContextMenu(posX, posY)
      }
    },
    [selected, onSelect, file, openFileContextMenu],
  )

  const onClick = useCallback(async () => {
    const { didSelect } = await onSelect(file, true)
    if (didSelect) {
      toggleAppPane(AppPaneId.Editor)
    }
  }, [file, onSelect, toggleAppPane])

  const IconComponent = () =>
    getFileIconComponent(getIconForFileType((file as FileItem).mimeType), 'w-10 h-10 flex-shrink-0')

  useContextMenuEvent(listItemRef, openContextMenu)

  return (
    <div
      ref={listItemRef}
      className={classNames('flex max-h-[300px] w-[190px] cursor-pointer px-1 pt-2 text-text md:w-[200px]')}
      id={file.uuid}
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
              <div className="break-word line-clamp-2 mr-2 overflow-hidden">{file.title}</div>
            </div>
            <ListItemMetadata item={file} hideDate={hideDate} sortBy={sortBy} />
            <ListItemTags hideTags={hideTags} tags={tags} />
            <ListItemConflictIndicator item={file} />
          </div>
        </div>
        <div
          className={classNames(
            'border-t-[1px] border-solid border-border p-3 text-xs font-bold',
            selected ? 'bg-info text-info-contrast' : 'bg-passive-4 text-neutral',
          )}
        >
          <div className="flex justify-between">
            {formatSizeToReadableString(file.decryptedSize)}
            {backupInfo && (
              <div title="File is backed up locally">
                <Icon type="check-circle" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default observer(FileListItem)
