import { KeyboardKey } from '@/Services/IOService'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import ChangeEditorMenu from '@/Components/ChangeEditor/ChangeEditorMenu'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'

type ChangeEditorOptionProps = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  note: SNNote
}

const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({ application, note }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  })
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, (open: boolean) => {
    setIsOpen(open)
    setIsVisible(open)
  })

  const toggleChangeEditorMenu = useCallback(() => {
    if (!isOpen) {
      const menuStyle = calculateSubmenuStyle(buttonRef.current)
      if (menuStyle) {
        setMenuStyle(menuStyle)
      }
    }

    setIsOpen(!isOpen)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const newMenuStyle = calculateSubmenuStyle(buttonRef.current, menuRef.current)

        if (newMenuStyle) {
          setMenuStyle(newMenuStyle)
          setIsVisible(true)
        }
      })
    }
  }, [isOpen])

  return (
    <div ref={menuContainerRef}>
      <Disclosure open={isOpen} onChange={toggleChangeEditorMenu}>
        <DisclosureButton
          onKeyDown={(event) => {
            if (event.key === KeyboardKey.Escape) {
              setIsOpen(false)
            }
          }}
          onBlur={closeOnBlur}
          ref={buttonRef}
          className="sn-dropdown-item justify-between"
        >
          <div className="flex items-center">
            <Icon type="dashboard" className="color-neutral mr-2" />
            Change note type
          </div>
          <Icon type="chevron-right" className="color-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          onKeyDown={(event) => {
            if (event.key === KeyboardKey.Escape) {
              setIsOpen(false)
              buttonRef.current?.focus()
            }
          }}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className="sn-dropdown flex flex-col max-h-120 min-w-68 fixed overflow-y-auto"
        >
          {isOpen && (
            <ChangeEditorMenu
              application={application}
              closeOnBlur={closeOnBlur}
              note={note}
              isVisible={isVisible}
              closeMenu={() => {
                setIsOpen(false)
              }}
            />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default ChangeEditorOption
