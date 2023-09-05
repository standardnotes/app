import { FileItem, FileBackupRecord } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { getFileIconComponent } from '../FilePreview/getFileIconComponent'
import ListItemConflictIndicator from './ListItemConflictIndicator'
import ListItemTags from './ListItemTags'
import ListItemMetadata from './ListItemMetadata'
import { DisplayableListItemProps } from './Types/DisplayableListItemProps'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { useContextMenuEvent } from '@/Hooks/useContextMenuEvent'
import { classNames } from '@standardnotes/utils'
import { getIconForFileType } from '@/Utils/Items/Icons/getIconForFileType'
import { useApplication } from '../ApplicationProvider'
import { PaneLayout } from '@/Controllers/PaneController/PaneLayout'
import ListItemFlagIcons from './ListItemFlagIcons'
import ListItemVaultInfo from './ListItemVaultInfo'

const FileListItemCard: FunctionComponent<DisplayableListItemProps<FileItem>> = ({
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
  const { setPaneLayout } = useResponsiveAppPane()
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
      setPaneLayout(PaneLayout.Editing)
    }
  }, [file, onSelect, setPaneLayout])

  const IconComponent = () =>
    getFileIconComponent(getIconForFileType((file as FileItem).mimeType), 'w-5 h-5 flex-shrink-0')

  useContextMenuEvent(listItemRef, openContextMenu)

  return (
    <div
      ref={listItemRef}
      role="button"
      className={classNames(
        'content-list-item flex w-full cursor-pointer items-stretch text-text',
        selected && 'selected border-l-2px border-solid border-info',
      )}
      id={file.uuid}
      onClick={onClick}
    >
      {!hideIcon ? (
        <div className="mr-0 flex flex-col items-center justify-between p-4.5 pr-3">
          <IconComponent />
        </div>
      ) : (
        <div className="pr-4" />
      )}
      <div className="min-w-0 flex-grow border-b border-solid border-border px-0 py-4">
        <div className="flex items-start justify-between overflow-hidden text-base font-semibold leading-[1.3]">
          <div className="break-word mr-2">{file.title}</div>
        </div>
        <ListItemMetadata item={file} hideDate={hideDate} sortBy={sortBy} />
        <ListItemTags hideTags={hideTags} tags={tags} />
        <ListItemConflictIndicator item={file} />
        <ListItemVaultInfo item={file} className="mt-1.5" />
      </div>
      <ListItemFlagIcons className="p-4" item={file} isFileBackedUp={!!backupInfo} />
    </div>
  )
}

export default observer(FileListItemCard)
