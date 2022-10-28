import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { FilesController } from '@/Controllers/FilesController'
import { FileItem } from '@standardnotes/snjs'
import { useState } from 'react'
import { PopoverFileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Icon from '../Icon/Icon'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import Switch from '../Switch/Switch'

type Props = {
  file: FileItem
  closeMenu: () => void
  handleFileAction: FilesController['handleFileAction']
  setIsRenamingFile: (set: boolean) => void
}

const LinkedFileMenuOptions = ({ file, closeMenu, handleFileAction, setIsRenamingFile }: Props) => {
  const [isFileProtected, setIsFileProtected] = useState(file.protected)

  return (
    <>
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          void handleFileAction({
            type: PopoverFileItemActionType.PreviewFile,
            payload: {
              file,
              otherFiles: [],
            },
          })
          closeMenu()
        }}
      >
        <Icon type="file" className="mr-2 text-neutral" />
        Preview file
      </button>
      <HorizontalSeparator classes="my-1" />
      <button
        className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.ToggleFileProtection,
            payload: { file },
            callback: (isProtected: boolean) => {
              setIsFileProtected(isProtected)
            },
          }).catch(console.error)
        }}
      >
        <span className="flex items-center">
          <Icon type="lock" className="mr-2 text-neutral" />
          Password protect
        </span>
        <Switch className="pointer-events-none px-0" tabIndex={FOCUSABLE_BUT_NOT_TABBABLE} checked={isFileProtected} />
      </button>
      <HorizontalSeparator classes="my-1" />
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.DownloadFile,
            payload: { file },
          }).catch(console.error)
          closeMenu()
        }}
      >
        <Icon type="download" className="mr-2 text-neutral" />
        Download
      </button>
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          setIsRenamingFile(true)
          closeMenu()
        }}
      >
        <Icon type="pencil" className="mr-2 text-neutral" />
        Rename
      </button>
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={() => {
          handleFileAction({
            type: PopoverFileItemActionType.DeleteFile,
            payload: { file },
          }).catch(console.error)
          closeMenu()
        }}
      >
        <Icon type="trash" className="mr-2 text-danger" />
        <span className="text-danger">Delete permanently</span>
      </button>
    </>
  )
}

export default LinkedFileMenuOptions
