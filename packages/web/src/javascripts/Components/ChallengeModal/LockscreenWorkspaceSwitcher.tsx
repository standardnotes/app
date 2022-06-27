import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import WorkspaceSwitcherMenu from '@/Components/AccountMenu/WorkspaceSwitcher/WorkspaceSwitcherMenu'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'

type Props = {
  mainApplicationGroup: ApplicationGroup
  viewControllerManager: ViewControllerManager
}

const LockscreenWorkspaceSwitcher: FunctionComponent<Props> = ({ mainApplicationGroup, viewControllerManager }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>()

  useCloseOnClickOutside(containerRef, () => setIsOpen(false))

  const toggleMenu = useCallback(() => {
    if (!isOpen) {
      const menuPosition = calculateSubmenuStyle(buttonRef.current)
      if (menuPosition) {
        setMenuStyle(menuPosition)
      }
    }

    setIsOpen(!isOpen)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      const timeToWaitBeforeCheckingMenuCollision = 0
      setTimeout(() => {
        const newMenuPosition = calculateSubmenuStyle(buttonRef.current, menuRef.current)

        if (newMenuPosition) {
          setMenuStyle(newMenuPosition)
        }
      }, timeToWaitBeforeCheckingMenuCollision)
    }
  }, [isOpen])

  return (
    <div ref={containerRef}>
      <Button ref={buttonRef} onClick={toggleMenu} className="flex items-center justify-center min-w-76 mt-2">
        <Icon type="user-switch" className="text-neutral mr-2" />
        Switch workspace
      </Button>
      {isOpen && (
        <div
          ref={menuRef}
          className="bg-default rounded-md shadow-main max-h-120 min-w-68 py-2 fixed overflow-y-auto"
          style={menuStyle}
        >
          <WorkspaceSwitcherMenu
            mainApplicationGroup={mainApplicationGroup}
            viewControllerManager={viewControllerManager}
            isOpen={isOpen}
            hideWorkspaceOptions={true}
          />
        </div>
      )}
    </div>
  )
}

export default LockscreenWorkspaceSwitcher
