import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import WorkspaceSwitcherMenu from './WorkspaceSwitcherMenu'
import MenuItem from '@/Components/Menu/MenuItem'
import Popover from '@/Components/Popover/Popover'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'

type Props = {
  mainApplicationGroup: WebApplicationGroup
  viewControllerManager: ViewControllerManager
}

const WorkspaceSwitcherOption: FunctionComponent<Props> = ({ mainApplicationGroup, viewControllerManager }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = useCallback(() => {
    setIsOpen((isOpen) => !isOpen)
  }, [])

  return (
    <>
      <MenuItem tabIndex={FOCUSABLE_BUT_NOT_TABBABLE} ref={buttonRef} onClick={toggleMenu} className="justify-between">
        <div className="flex items-center">
          <Icon type="user-switch" className={`mr-2 text-neutral ${MenuItemIconSize}`} />
          Switch workspace
        </div>
        <Icon type="chevron-right" className={`text-neutral ${MenuItemIconSize}`} />
      </MenuItem>
      <Popover
        title="Switch workspace"
        align="end"
        anchorElement={buttonRef.current}
        className="py-2"
        open={isOpen}
        side="right"
        togglePopover={toggleMenu}
      >
        <WorkspaceSwitcherMenu
          mainApplicationGroup={mainApplicationGroup}
          viewControllerManager={viewControllerManager}
          isOpen={isOpen}
        />
      </Popover>
    </>
  )
}

export default observer(WorkspaceSwitcherOption)
