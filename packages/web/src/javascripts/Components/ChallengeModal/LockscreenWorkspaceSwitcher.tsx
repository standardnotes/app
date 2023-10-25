import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import WorkspaceSwitcherMenu from '@/Components/AccountMenu/WorkspaceSwitcher/WorkspaceSwitcherMenu'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import Popover from '../Popover/Popover'

type Props = {
  mainApplicationGroup: WebApplicationGroup
}

const LockscreenWorkspaceSwitcher: FunctionComponent<Props> = ({ mainApplicationGroup }) => {
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
        title="Switch workspace"
        align="center"
        anchorElement={buttonRef}
        open={isOpen}
        overrideZIndex="z-modal"
        side="right"
        togglePopover={toggleMenu}
      >
        <WorkspaceSwitcherMenu mainApplicationGroup={mainApplicationGroup} hideWorkspaceOptions={true} />
      </Popover>
    </div>
  )
}

export default LockscreenWorkspaceSwitcher
