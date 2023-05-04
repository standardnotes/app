import { observer } from 'mobx-react-lite'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { WebApplication } from '@/Application/WebApplication'
import { useCallback, FunctionComponent, KeyboardEventHandler } from 'react'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { AccountMenuPane } from './AccountMenuPane'
import MenuPaneSelector from './MenuPaneSelector'
import { KeyboardKey } from '@standardnotes/ui-services'

export type AccountMenuProps = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  onClickOutside: () => void
  mainApplicationGroup: WebApplicationGroup
}

const AccountMenu: FunctionComponent<AccountMenuProps> = ({
  application,
  viewControllerManager,
  mainApplicationGroup,
}) => {
  const { currentPane } = viewControllerManager.accountMenuController

  const closeAccountMenu = useCallback(() => {
    viewControllerManager.accountMenuController.closeAccountMenu()
  }, [viewControllerManager])

  const setCurrentPane = useCallback(
    (pane: AccountMenuPane) => {
      viewControllerManager.accountMenuController.setCurrentPane(pane)
    },
    [viewControllerManager],
  )

  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (event.key === KeyboardKey.Escape) {
        if (currentPane === AccountMenuPane.GeneralMenu) {
          closeAccountMenu()
        } else if (currentPane === AccountMenuPane.ConfirmPassword) {
          setCurrentPane(AccountMenuPane.Register)
        } else {
          setCurrentPane(AccountMenuPane.GeneralMenu)
        }
      }
    },
    [closeAccountMenu, currentPane, setCurrentPane],
  )

  return (
    <div id="account-menu" className="sn-component" onKeyDown={handleKeyDown}>
      <MenuPaneSelector
        viewControllerManager={viewControllerManager}
        application={application}
        mainApplicationGroup={mainApplicationGroup}
        menuPane={currentPane}
        setMenuPane={setCurrentPane}
        closeMenu={closeAccountMenu}
      />
    </div>
  )
}

export default observer(AccountMenu)
