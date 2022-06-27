import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import WorkspaceSwitcherMenu from './WorkspaceSwitcherMenu'
import MenuItem from '@/Components/Menu/MenuItem'
import { MenuItemType } from '@/Components/Menu/MenuItemType'

type Props = {
  mainApplicationGroup: ApplicationGroup
  viewControllerManager: ViewControllerManager
}

const WorkspaceSwitcherOption: FunctionComponent<Props> = ({ mainApplicationGroup, viewControllerManager }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<SubmenuStyle>()

  const toggleMenu = useCallback(() => {
    if (!isOpen) {
      const menuPosition = calculateSubmenuStyle(buttonRef.current)
      if (menuPosition) {
        setMenuStyle(menuPosition)
      }
    }

    setIsOpen(!isOpen)
  }, [isOpen, setIsOpen])

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
    <>
      <MenuItem
        tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
        ref={buttonRef}
        type={MenuItemType.IconButton}
        onClick={toggleMenu}
        className="justify-between"
      >
        <div className="flex items-center">
          <Icon type="user-switch" className="text-neutral mr-2" />
          Switch workspace
        </div>
        <Icon type="chevron-right" className="text-neutral" />
      </MenuItem>
      {isOpen && (
        <div
          ref={menuRef}
          className="bg-default rounded shadow-main max-h-120 min-w-68 py-2 fixed overflow-y-auto"
          style={menuStyle}
        >
          <WorkspaceSwitcherMenu
            mainApplicationGroup={mainApplicationGroup}
            viewControllerManager={viewControllerManager}
            isOpen={isOpen}
          />
        </div>
      )}
    </>
  )
}

export default observer(WorkspaceSwitcherOption)
