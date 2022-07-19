import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import WorkspaceSwitcherMenu from '@/Components/AccountMenu/WorkspaceSwitcher/WorkspaceSwitcherMenu'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import Popover from '../Popover/Popover'

type Props = {
  mainApplicationGroup: ApplicationGroup
  viewControllerManager: ViewControllerManager
}

const LockscreenWorkspaceSwitcher: FunctionComponent<Props> = ({ mainApplicationGroup, viewControllerManager }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  return (
    <div ref={containerRef}>
      <Button ref={buttonRef} onClick={toggleMenu} className="mt-2 flex min-w-76 items-center justify-center">
        <Icon type="user-switch" className="mr-2 text-neutral" />
        Switch workspace
      </Button>
      <Popover
        anchorElement={buttonRef.current}
        open={isOpen}
        togglePopover={toggleMenu}
        side="right"
        align="center"
        overrideZIndex="z-modal"
      >
        <WorkspaceSwitcherMenu
          mainApplicationGroup={mainApplicationGroup}
          viewControllerManager={viewControllerManager}
          isOpen={isOpen}
          hideWorkspaceOptions={true}
        />
      </Popover>
    </div>
  )
}

export default LockscreenWorkspaceSwitcher
