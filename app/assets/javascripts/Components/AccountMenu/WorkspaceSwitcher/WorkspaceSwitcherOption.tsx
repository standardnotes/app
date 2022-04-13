import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { AppState } from '@/UIModels/AppState'
import { calculateSubmenuStyle, SubmenuStyle } from '@/Utils/CalculateSubmenuStyle'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { Icon } from '@/Components/Icon'
import { WorkspaceSwitcherMenu } from './WorkspaceSwitcherMenu'

type Props = {
  mainApplicationGroup: ApplicationGroup
  appState: AppState
}

export const WorkspaceSwitcherOption: FunctionComponent<Props> = observer(
  ({ mainApplicationGroup, appState }) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [menuStyle, setMenuStyle] = useState<SubmenuStyle>()

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
      <>
        <button
          ref={buttonRef}
          className="sn-dropdown-item justify-between focus:bg-info-backdrop focus:shadow-none"
          tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
          role="menuitem"
          onClick={toggleMenu}
        >
          <div className="flex items-center">
            <Icon type="user-switch" className="color-neutral mr-2" />
            Switch workspace
          </div>
          <Icon type="chevron-right" className="color-neutral" />
        </button>
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
      </>
    )
  },
)
