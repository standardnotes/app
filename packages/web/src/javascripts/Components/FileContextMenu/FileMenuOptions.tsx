import { FunctionComponent, useCallback, useMemo } from 'react'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '@/Components/Icon/Icon'
import { observer } from 'mobx-react-lite'
import { FilesController } from '@/Controllers/FilesController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { useResponsiveAppPane } from '../Panes/ResponsivePaneProvider'
import { AppPaneId } from '../Panes/AppPaneMetadata'
import MenuItem from '../Menu/MenuItem'
import { FileContextMenuBackupOption } from './FileContextMenuBackupOption'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import { FileItem } from '@standardnotes/snjs'
import AddTagOption from '../NotesOptions/AddTagOption'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import { LinkingController } from '@/Controllers/LinkingController'
import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import AddToVaultMenuOption from '../Vaults/AddToVaultMenuOption'
import { iconClass } from '../NotesOptions/ClassNames'
import { FeatureTrunkName, featureTrunkEnabled } from '@/WebFeatureTrunk'

type Props = {
  closeMenu: () => void
  filesController: FilesController
  linkingController: LinkingController
  navigationController: NavigationController
  isFileAttachedToNote?: boolean
  renameToggleCallback?: (isRenamingFile: boolean) => void
  shouldShowRenameOption: boolean
  shouldShowAttachOption: boolean
  selectedFiles: FileItem[]
}

const FileMenuOptions: FunctionComponent<Props> = ({
  closeMenu,
  filesController,
  linkingController,
  navigationController,
  isFileAttachedToNote,
  renameToggleCallback,
  shouldShowRenameOption,
  shouldShowAttachOption,
  selectedFiles,
}) => {
  const { handleFileAction } = filesController
  const { toggleAppPane } = useResponsiveAppPane()

  const hasProtectedFiles = useMemo(() => selectedFiles.some((file) => file.protected), [selectedFiles])
  const hasSelectedMultipleFiles = useMemo(() => selectedFiles.length > 1, [selectedFiles.length])

  const totalFileSize = useMemo(
    () => selectedFiles.map((file) => file.decryptedSize).reduce((prev, next) => prev + next, 0),
    [selectedFiles],
  )

  const onDetach = useCallback(() => {
    const file = selectedFiles[0]
    void handleFileAction({
      type: FileItemActionType.DetachFileToNote,
      payload: { file },
    })
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  const onAttach = useCallback(() => {
    const file = selectedFiles[0]
    void handleFileAction({
      type: FileItemActionType.AttachFileToNote,
      payload: { file },
    })
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  const closeMenuAndToggleFilesList = useCallback(() => {
    toggleAppPane(AppPaneId.Items)
    closeMenu()
  }, [closeMenu, toggleAppPane])

  return (
    <>
      {selectedFiles.length === 1 && (
        <>
          {isFileAttachedToNote ? (
            <MenuItem onClick={onDetach}>
              <Icon type="link-off" className="mr-2 text-neutral" />
              Detach from note
            </MenuItem>
          ) : shouldShowAttachOption ? (
            <MenuItem onClick={onAttach}>
              <Icon type="link" className="mr-2 text-neutral" />
              Attach to note
            </MenuItem>
          ) : null}
        </>
      )}
      {featureTrunkEnabled(FeatureTrunkName.Vaults) && (
        <AddToVaultMenuOption iconClassName={iconClass} items={selectedFiles} />
      )}
      <AddTagOption
        navigationController={navigationController}
        linkingController={linkingController}
        selectedItems={selectedFiles}
        iconClassName={`text-neutral mr-2 ${MenuItemIconSize}`}
      />
      <MenuSwitchButtonItem
        checked={hasProtectedFiles}
        onChange={(hasProtectedFiles) => {
          void filesController.setProtectionForFiles(hasProtectedFiles, selectedFiles)
        }}
      >
        <Icon type="lock" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
        Password protect
      </MenuSwitchButtonItem>
      <HorizontalSeparator classes="my-1" />
      <MenuItem
        onClick={() => {
          void filesController.downloadFiles(selectedFiles)
          closeMenu()
        }}
      >
        <Icon type="download" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
        Download
      </MenuItem>
      {shouldShowRenameOption && (
        <MenuItem
          onClick={() => {
            renameToggleCallback?.(true)
          }}
        >
          <Icon type="pencil" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
          Rename
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          closeMenuAndToggleFilesList()
          void filesController.deleteFilesPermanently(selectedFiles)
        }}
      >
        <Icon type="trash" className={`mr-2 text-danger ${MenuItemIconSize}`} />
        <span className="text-danger">Delete permanently</span>
      </MenuItem>

      <FileContextMenuBackupOption file={selectedFiles[0]} />

      <HorizontalSeparator classes="my-2" />
      <div className="px-3 pt-1 pb-0.5 text-xs font-medium text-neutral">
        {!hasSelectedMultipleFiles && (
          <div className="mb-1">
            <span className="font-semibold">File ID:</span> {selectedFiles[0].uuid}
          </div>
        )}
        <div>
          <span className="font-semibold">{hasSelectedMultipleFiles ? 'Total Size:' : 'Size:'}</span>{' '}
          {formatSizeToReadableString(totalFileSize)}
        </div>
      </div>
    </>
  )
}

export default observer(FileMenuOptions)
