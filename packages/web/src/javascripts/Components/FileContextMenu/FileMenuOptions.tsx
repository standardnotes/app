import { FunctionComponent, useCallback, useMemo } from 'react'
import { PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { observer } from 'mobx-react-lite'
import { FilesController } from '@/Controllers/FilesController'
import { SelectedItemsController } from '@/Controllers/SelectedItemsController'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

type Props = {
  closeMenu: () => void
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  filesController: FilesController
  selectionController: SelectedItemsController
  isFileAttachedToNote?: boolean
  renameToggleCallback?: (isRenamingFile: boolean) => void
  shouldShowRenameOption: boolean
  shouldShowAttachOption: boolean
}

const FileMenuOptions: FunctionComponent<Props> = ({
  closeMenu,
  closeOnBlur,
  filesController,
  selectionController,
  isFileAttachedToNote,
  renameToggleCallback,
  shouldShowRenameOption,
  shouldShowAttachOption,
}) => {
  const { selectedFiles } = selectionController
  const { handleFileAction } = filesController

  const hasProtectedFiles = useMemo(() => selectedFiles.some((file) => file.protected), [selectedFiles])

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

  return (
    <>
      <button
        onBlur={closeOnBlur}
        className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
        onClick={onPreview}
      >
        <Icon type="file" className="mr-2 text-neutral" />
        Preview file
      </button>
      {selectedFiles.length === 1 && (
        <>
          {isFileAttachedToNote ? (
            <button
              onBlur={closeOnBlur}
              className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
              onClick={onDetach}
            >
              <Icon type="link-off" className="mr-2 text-neutral" />
              Detach from note
            </button>
          ) : shouldShowAttachOption ? (
            <button
              onBlur={closeOnBlur}
              className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
              onClick={onAttach}
            >
              <Icon type="link" className="mr-2 text-neutral" />
              Attach to note
            </button>
          ) : null}
        </>
      )}
      <HorizontalSeparator classes="my-1" />
      <button
        className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm justify-between"
        onClick={() => {
          void filesController.setProtectionForFiles(!hasProtectedFiles, selectionController.selectedFiles)
        }}
        onBlur={closeOnBlur}
      >
        <span className="flex items-center">
          <Icon type="password" className="mr-2 text-neutral" />
          Password protection
        </span>
        <Switch
          className="px-0 pointer-events-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          checked={hasProtectedFiles}
        />
      </button>
      <HorizontalSeparator classes="my-1" />
      <button
        onBlur={closeOnBlur}
        className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
        onClick={() => {
          void filesController.downloadFiles(selectionController.selectedFiles)
        }}
      >
        <Icon type="download" className="mr-2 text-neutral" />
        Download
      </button>
      {shouldShowRenameOption && (
        <button
          onBlur={closeOnBlur}
          className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
          onClick={() => {
            renameToggleCallback?.(true)
          }}
        >
          <Icon type="pencil" className="mr-2 text-neutral" />
          Rename
        </button>
      )}
      <button
        onBlur={closeOnBlur}
        className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm"
        onClick={() => {
          void filesController.deleteFilesPermanently(selectionController.selectedFiles)
        }}
      >
        <Icon type="trash" className="mr-2 text-danger" />
        <span className="text-danger">Delete permanently</span>
      </button>
      {selectedFiles.length === 1 && (
        <div className="px-3 pt-1.5 pb-0.5 text-xs text-neutral font-medium">
          <div>
            <span className="font-semibold">File ID:</span> {selectedFiles[0].uuid}
          </div>
        </div>
      )}
    </>
  )
}

export default observer(FileMenuOptions)
