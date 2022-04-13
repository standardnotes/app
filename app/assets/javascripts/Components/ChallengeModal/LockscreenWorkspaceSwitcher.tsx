import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { AppState } from '@/UIModels/AppState'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { FunctionComponent } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { WorkspaceSwitcherMenu } from '@/Components/AccountMenu/WorkspaceSwitcher/WorkspaceSwitcherMenu'
import { Button } from '@/Components/Button/Button'
import { Icon } from '@/Components/Icon'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'

type Props = {
  mainApplicationGroup: ApplicationGroup
  appState: AppState
}

export const LockscreenWorkspaceSwitcher: FunctionComponent<Props> = ({
  mainApplicationGroup,
  appState,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>()

  useCloseOnClickOutside(containerRef, () => setIsOpen(false))

  const toggleMenu = () => {
    if (!isOpen) {
      const menuPosition = calculateSubmenuStyle(buttonRef.current)
      if (menuPosition) {
        setMenuStyle(menuPosition)
      }
    }

    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const newMenuPosition = calculateSubmenuStyle(buttonRef.current, menuRef.current)

        if (newMenuPosition) {
          setMenuStyle(newMenuPosition)
        }
      })
    }
  }, [isOpen])

  return (
    <div ref={containerRef}>
      <Button
        ref={buttonRef}
        onClick={toggleMenu}
        className="flex items-center justify-center min-w-76 mt-2"
      >
        <Icon type="user-switch" className="color-neutral mr-2" />
        Switch workspace
      </Button>
      {isOpen && (
        <div
          ref={menuRef}
          className="sn-dropdown max-h-120 min-w-68 py-2 fixed overflow-y-auto"
          style={menuStyle}
        >
          <WorkspaceSwitcherMenu
            mainApplicationGroup={mainApplicationGroup}
            appState={appState}
            isOpen={isOpen}
          />
        </div>
      )}
    </div>
  )
}
