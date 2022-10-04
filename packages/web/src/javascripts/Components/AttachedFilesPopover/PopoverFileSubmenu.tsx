import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { PopoverFileSubmenuProps } from './PopoverFileItemProps'
import { PopoverFileItemActionType } from './PopoverFileItemAction'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import Popover from '../Popover/Popover'

const PopoverFileSubmenu: FunctionComponent<PopoverFileSubmenuProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
  setIsRenamingFile,
  previewHandler,
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isOpen, setIsOpen] = useState(false)
  const [isFileProtected, setIsFileProtected] = useState(file.protected)

  const closeMenu = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  return (
    <div ref={menuContainerRef}>
      <button
        ref={menuButtonRef}
        onClick={toggleMenu}
        className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-1 hover:bg-contrast"
      >
        <Icon type="more" className="text-neutral" />
      </button>
      <Popover anchorElement={menuButtonRef.current} open={isOpen} togglePopover={toggleMenu} className="py-2">
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
          onClick={() => {
            previewHandler(file)
            closeMenu()
          }}
        >
          <Icon type="file" className="mr-2 text-neutral" />
          Preview file
        </button>
        {isAttachedToNote ? (
          <button
            className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
            onClick={() => {
              handleFileAction({
                type: PopoverFileItemActionType.DetachFileToNote,
                payload: { file },
              }).catch(console.error)
              closeMenu()
            }}
          >
            <Icon type="link-off" className="mr-2 text-neutral" />
            Detach from note
          </button>
        ) : (
          <button
            className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
            onClick={() => {
              handleFileAction({
                type: PopoverFileItemActionType.AttachFileToNote,
                payload: { file },
              }).catch(console.error)
              closeMenu()
            }}
          >
            <Icon type="link" className="mr-2 text-neutral" />
            Attach to note
          </button>
        )}
        <HorizontalSeparator classes="my-1" />
        <button
          className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
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
            <Icon type="password" className="mr-2 text-neutral" />
            Password protection
          </span>
          <Switch
            className="pointer-events-none px-0"
            tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            checked={isFileProtected}
          />
        </button>
        <HorizontalSeparator classes="my-1" />
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
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
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
          onClick={() => {
            setIsRenamingFile(true)
            closeMenu()
          }}
        >
          <Icon type="pencil" className="mr-2 text-neutral" />
          Rename
        </button>
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-mobile-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none md:text-sm"
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
        <div className="px-3 py-1 text-xs font-medium text-neutral">
          <div className="mb-1">
            <span className="font-semibold">File ID:</span> {file.uuid}
          </div>
          <div>
            <span className="font-semibold">Size:</span> {formatSizeToReadableString(file.decryptedSize)}
          </div>
        </div>
      </Popover>
    </div>
  )
}

export default PopoverFileSubmenu
