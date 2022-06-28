import { WebApplication } from '@/Application/Application'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import ListedActionsMenu from './ListedActionsMenu'

type Props = {
  application: WebApplication
  note: SNNote
}

const ListedActionsOption: FunctionComponent<Props> = ({ application, note }) => {
  const menuContainerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>({
    right: 0,
    bottom: 0,
    maxHeight: 'auto',
  })

  const [closeOnBlur] = useCloseOnBlur(menuContainerRef, setIsMenuOpen)

  const toggleListedMenu = useCallback(() => {
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
      <Disclosure open={isMenuOpen} onChange={toggleListedMenu}>
        <DisclosureButton
          ref={menuButtonRef}
          onBlur={closeOnBlur}
          className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-menu-item text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        >
          <div className="flex items-center">
            <Icon type="listed" className="mr-2 text-neutral" />
            Listed actions
          </div>
          <Icon type="chevron-right" className="text-neutral" />
        </DisclosureButton>
        <DisclosurePanel
          ref={menuRef}
          style={{
            ...menuStyle,
            position: 'fixed',
          }}
          className={`${
            isMenuOpen ? 'flex' : 'hidden'
          } max-h-120 fixed min-w-68 flex-col overflow-y-auto rounded bg-default pb-1 shadow-main`}
        >
          {isMenuOpen && (
            <ListedActionsMenu application={application} note={note} recalculateMenuStyle={recalculateMenuStyle} />
          )}
        </DisclosurePanel>
      </Disclosure>
    </div>
  )
}

export default ListedActionsOption
