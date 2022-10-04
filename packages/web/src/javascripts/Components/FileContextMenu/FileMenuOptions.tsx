import { FunctionComponent, useCallback, useMemo } from 'react'
import { PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '@/Components/Icon/Icon'
import { observer } from 'mobx-react-lite'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import MenuItem from '../Menu/MenuItem'
import { MenuItemType } from '../Menu/MenuItemType'

type Props = {
  closeMenu: () => void
  filesController: FilesController
  selectionController: SelectedItemsController
  isFileAttachedToNote?: boolean
  renameToggleCallback?: (isRenamingFile: boolean) => void
  shouldShowRenameOption: boolean
  shouldShowAttachOption: boolean
}

const FileMenuOptions: FunctionComponent<Props> = ({
  closeMenu,
  filesController,
  selectionController,
  isFileAttachedToNote,
  renameToggleCallback,
  shouldShowRenameOption,
  shouldShowAttachOption,
}) => {
  const { selectedFiles } = selectionController
  const { handleFileAction } = filesController
  const { toggleAppPane } = useResponsiveAppPane()

  const hasProtectedFiles = useMemo(() => selectedFiles.some((file) => file.protected), [selectedFiles])
  const hasSelectedMultipleFiles = useMemo(() => selectedFiles.length > 1, [selectedFiles.length])

  const totalFileSize = useMemo(
    () => selectedFiles.map((file) => file.decryptedSize).reduce((prev, next) => prev + next, 0),
    [selectedFiles],
  )

  const onPreview = useCallback(() => {
    void handleFileAction({
      type: PopoverFileItemActionType.PreviewFile,
      payload: {
        file: selectedFiles[0],
        otherFiles: selectedFiles.length > 1 ? selectedFiles : filesController.allFiles,
      },
    })
    closeMenu()
  }, [closeMenu, filesController.allFiles, handleFileAction, selectedFiles])

  const onDetach = useCallback(() => {
    const file = selectedFiles[0]
    void handleFileAction({
      type: PopoverFileItemActionType.DetachFileToNote,
      payload: { file },
    })
    closeMenu()
  }, [closeMenu, handleFileAction, selectedFiles])

  const onAttach = useCallback(() => {
    const file = selectedFiles[0]
    void handleFileAction({
      type: PopoverFileItemActionType.AttachFileToNote,
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
      <MenuItem onClick={onPreview}>
        <Icon type="file" className="mr-2 text-neutral" />
        Preview file
      </MenuItem>
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
      <HorizontalSeparator classes="my-1" />
      <MenuItem
        type={MenuItemType.SwitchButton}
        checked={hasProtectedFiles}
        onChange={(hasProtectedFiles) => {
          void filesController.setProtectionForFiles(hasProtectedFiles, selectionController.selectedFiles)
        }}
      >
        <Icon type="password" className="mr-2 text-neutral" />
        Password protection
      </MenuItem>
      <HorizontalSeparator classes="my-1" />
      <MenuItem
        onClick={() => {
          void filesController.downloadFiles(selectionController.selectedFiles)
        }}
      >
        <Icon type="download" className="mr-2 text-neutral" />
        Download
      </MenuItem>
      {shouldShowRenameOption && (
        <MenuItem
          onClick={() => {
            renameToggleCallback?.(true)
          }}
        >
          <Icon type="pencil" className="mr-2 text-neutral" />
          Rename
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          closeMenuAndToggleFilesList()
          void filesController.deleteFilesPermanently(selectionController.selectedFiles)
        }}
      >
        <Icon type="trash" className="mr-2 text-danger" />
        <span className="text-danger">Delete permanently</span>
      </MenuItem>
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
