import { KeyboardKey } from '@/Services/IOService'
import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { IconType, SNComponent, SNNote } from '@standardnotes/snjs'
import { FunctionComponent } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from '@/Components/Icon'
import { ChangeEditorMenu } from '@/Components/ChangeEditor/ChangeEditorMenu'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'

type ChangeEditorOptionProps = {
  appState: AppState
  application: WebApplication
  note: SNNote
}

type AccordionMenuGroup<T> = {
  icon?: IconType
  iconClassName?: string
  title: string
  items: Array<T>
}

export type EditorMenuItem = {
  name: string
  component?: SNComponent
  isEntitled: boolean
}

export type EditorMenuGroup = AccordionMenuGroup<EditorMenuItem>

export const ChangeEditorOption: FunctionComponent<ChangeEditorOptionProps> = ({ application, note }) => {
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

  const toggleChangeEditorMenu = () => {
    if (!isOpen) {
      const menuStyle = calculateSubmenuStyle(buttonRef.current)
      if (menuStyle) {
        setMenuStyle(menuStyle)
      }
    }

    setIsOpen(!isOpen)
  }

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
