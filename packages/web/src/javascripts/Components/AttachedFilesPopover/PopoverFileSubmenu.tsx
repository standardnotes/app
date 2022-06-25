import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { PopoverFileSubmenuProps } from './PopoverFileItemProps'
import { PopoverFileItemActionType } from './PopoverFileItemAction'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

const PopoverFileSubmenu: FunctionComponent<PopoverFileSubmenuProps> = ({
  file,
  isAttachedToNote,
  handleFileAction,
  setIsRenamingFile,
  previewHandler,
}) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFileProtected, setIsFileProtected] = useState(file.protected)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  })
  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, setIsMenuOpen)

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false)
  }, [])

  const toggleMenu = useCallback(() => {
    if (!isMenuOpen) {
      const menuPosition = calculateSubmenuStyle(menuButtonRef.current)
      if (menuPosition) {
        setMenuStyle(menuPosition)
      }
    }

    setIsMenuOpen(!isMenuOpen)
  }, [isMenuOpen])

  const recalculateMenuStyle = useCallback(() => {
    const newMenuPosition = calculateSubmenuStyle(menuButtonRef.current, menuRef.current)

    if (newMenuPosition) {
      setMenuStyle(newMenuPosition)
    }
  }, [])

  useEffect(() => {
    if (isMenuOpen) {
      setTimeout(() => {
        recalculateMenuStyle()
      })
    }
  }, [isMenuOpen, recalculateMenuStyle])

  return (
    <div ref={menuContainerRef}>
      <Disclosure open={isMenuOpen} onChange={toggleMenu}>
        <DisclosureButton
          ref={menuButtonRef}
          onBlur={closeOnBlur}
          className="w-7 h-7 p-1 rounded-full border-0 bg-transparent hover:bg-contrast cursor-pointer"
        >
          <Icon type="more" className="text-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } flex-col bg-default rounded shadow-menu max-h-120 min-w-60 py-1 fixed overflow-y-auto`}
        >
          {isMenuOpen && (
            <>
              <button
                onBlur={closeOnBlur}
                className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm focus:bg-info-backdrop"
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
                  onBlur={closeOnBlur}
                  className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm focus:bg-info-backdrop"
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
                  onBlur={closeOnBlur}
                  className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm focus:bg-info-backdrop"
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
                className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm justify-between focus:bg-info-backdrop"
                onClick={() => {
                  handleFileAction({
                    type: PopoverFileItemActionType.ToggleFileProtection,
                    payload: { file },
                    callback: (isProtected: boolean) => {
                      setIsFileProtected(isProtected)
                    },
                  }).catch(console.error)
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
                  checked={isFileProtected}
                />
              </button>
              <HorizontalSeparator classes="my-1" />
              <button
                onBlur={closeOnBlur}
                className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm focus:bg-info-backdrop"
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
                onBlur={closeOnBlur}
                className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm focus:bg-info-backdrop"
                onClick={() => {
                  setIsRenamingFile(true)
                }}
              >
                <Icon type="pencil" className="mr-2 text-neutral" />
                Rename
              </button>
              <button
                onBlur={closeOnBlur}
                className="flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-1.5 text-left w-full focus:shadow-none text-sm focus:bg-info-backdrop"
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
              <div className="px-3 py-1 text-xs text-neutral font-medium">
                <div>
                  <span className="font-semibold">File ID:</span> {file.uuid}
                </div>
              </div>
            </>
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default PopoverFileSubmenu
