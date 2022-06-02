import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { FileItem } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { PopoverFileItemAction, PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'

type Props = {
  closeMenu: () => void
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
  file: FileItem
  fileProtectionToggleCallback?: (isProtected: boolean) => void
  handleFileAction: (action: PopoverFileItemAction) => Promise<boolean>
  isFileAttachedToNote?: boolean
  renameToggleCallback?: (isRenamingFile: boolean) => void
  shouldShowRenameOption: boolean
  shouldShowAttachOption: boolean
}

const FileMenuOptions: FunctionComponent<Props> = ({
  closeMenu,
  closeOnBlur,
  file,
  fileProtectionToggleCallback,
  handleFileAction,
  isFileAttachedToNote,
  renameToggleCallback,
  shouldShowRenameOption,
  shouldShowAttachOption,
}) => {
  return (
    <>
      <button
        onBlur={closeOnBlur}
        className="sn-dropdown-item focus:bg-info-backdrop"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.PreviewFile,
            payload: file,
          }).catch(console.error)
          closeMenu()
        }}
      >
        <Icon type="file" className="mr-2 color-neutral" />
        Preview file
      </button>
      {isFileAttachedToNote ? (
        <button
          onBlur={closeOnBlur}
          className="sn-dropdown-item focus:bg-info-backdrop"
          onClick={() => {
            handleFileAction({
              type: PopoverFileItemActionType.DetachFileToNote,
              payload: file,
            }).catch(console.error)
            closeMenu()
          }}
        >
          <Icon type="link-off" className="mr-2 color-neutral" />
          Detach from note
        </button>
      ) : shouldShowAttachOption ? (
        <button
          onBlur={closeOnBlur}
          className="sn-dropdown-item focus:bg-info-backdrop"
          onClick={() => {
            handleFileAction({
              type: PopoverFileItemActionType.AttachFileToNote,
              payload: file,
            }).catch(console.error)
            closeMenu()
          }}
        >
          <Icon type="link" className="mr-2 color-neutral" />
          Attach to note
        </button>
      ) : null}
      <div className="min-h-1px my-1 bg-border"></div>
      <button
        className="sn-dropdown-item justify-between focus:bg-info-backdrop"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.ToggleFileProtection,
            payload: file,
            callback: (isProtected: boolean) => {
              fileProtectionToggleCallback?.(isProtected)
            },
          }).catch(console.error)
        }}
        onBlur={closeOnBlur}
      >
        <span className="flex items-center">
          <Icon type="password" className="mr-2 color-neutral" />
          Password protection
        </span>
        <Switch className="px-0 pointer-events-none" tabIndex={FOCUSABLE_BUT_NOT_TABBABLE} checked={file.protected} />
      </button>
      <div className="min-h-1px my-1 bg-border"></div>
      <button
        onBlur={closeOnBlur}
        className="sn-dropdown-item focus:bg-info-backdrop"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.DownloadFile,
            payload: file,
          }).catch(console.error)
          closeMenu()
        }}
      >
        <Icon type="download" className="mr-2 color-neutral" />
        Download
      </button>
      {shouldShowRenameOption && (
        <button
          onBlur={closeOnBlur}
          className="sn-dropdown-item focus:bg-info-backdrop"
          onClick={() => {
            renameToggleCallback?.(true)
          }}
        >
          <Icon type="pencil" className="mr-2 color-neutral" />
          Rename
        </button>
      )}
      <button
        onBlur={closeOnBlur}
        className="sn-dropdown-item focus:bg-info-backdrop"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.DeleteFile,
            payload: file,
          }).catch(console.error)
          closeMenu()
        }}
      >
        <Icon type="trash" className="mr-2 color-danger" />
        <span className="color-danger">Delete permanently</span>
      </button>
    </>
  )
}

export default FileMenuOptions
