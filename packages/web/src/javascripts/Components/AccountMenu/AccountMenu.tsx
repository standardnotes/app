import { observer } from 'mobx-react-lite'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { WebApplication } from '@/Application/Application'
import { useCallback, useRef, FunctionComponent, KeyboardEventHandler } from 'react'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { AccountMenuPane } from './AccountMenuPane'
import MenuPaneSelector from './MenuPaneSelector'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  onClickOutside: () => void
  mainApplicationGroup: ApplicationGroup
}

const AccountMenu: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
  onClickOutside,
  mainApplicationGroup,
}) => {
  const { currentPane, shouldAnimateCloseMenu } = viewControllerManager.accountMenuController

  const closeAccountMenu = useCallback(() => {
    viewControllerManager.accountMenuController.closeAccountMenu()
  }, [viewControllerManager])

  const setCurrentPane = useCallback(
    (pane: AccountMenuPane) => {
      viewControllerManager.accountMenuController.setCurrentPane(pane)
    },
    [viewControllerManager],
  )

  const ref = useRef<HTMLDivElement>(null)
  useCloseOnClickOutside(ref, () => {
    onClickOutside()
  })

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      switch (event.key) {
        case 'Escape':
          if (currentPane === AccountMenuPane.GeneralMenu) {
            closeAccountMenu()
          } else if (currentPane === AccountMenuPane.ConfirmPassword) {
            setCurrentPane(AccountMenuPane.Register)
          } else {
            setCurrentPane(AccountMenuPane.GeneralMenu)
          }
          break
      }
    },
    [closeAccountMenu, currentPane, setCurrentPane],
  )

  return (
    <div ref={ref} id="account-menu" className="sn-component">
      <div
        className={`z-footer-bar-item-panel bottom-full left-0 cursor-auto sn-dropdown ${
          shouldAnimateCloseMenu ? 'slide-up-animation' : 'sn-dropdown--animated'
        } min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto absolute`}
        onKeyDown={handleKeyDown}
      >
        <MenuPaneSelector
          viewControllerManager={viewControllerManager}
          application={application}
          mainApplicationGroup={mainApplicationGroup}
          menuPane={currentPane}
          setMenuPane={setCurrentPane}
          closeMenu={closeAccountMenu}
        />
      </div>
    </div>
  )
}

export default observer(AccountMenu)
