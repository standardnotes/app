import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import WorkspaceSwitcherMenu from './WorkspaceSwitcherMenu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'
import Popover from '@/Components/Popover/Popover'

type Props = {
  mainApplicationGroup: ApplicationGroup
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
      <MenuItem
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
        ref={buttonRef}
        type={MenuItemType.IconButton}
        onClick={toggleMenu}
        className="justify-between"
      >
        <div className="flex items-center">
          <Icon type="user-switch" className="mr-2 text-neutral" />
          Switch workspace
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      <Popover
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
