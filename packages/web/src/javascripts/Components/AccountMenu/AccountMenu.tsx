import { observer } from 'mobx-react-lite'
import { useCallback, FunctionComponent, KeyboardEventHandler } from 'react'
import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { AccountMenuPane } from './AccountMenuPane'
import MenuPaneSelector from './MenuPaneSelector'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useApplication } from '../ApplicationProvider'

export type AccountMenuProps = {
  onClickOutside: () => void
  mainApplicationGroup: WebApplicationGroup
}

const AccountMenu: FunctionComponent<AccountMenuProps> = ({ mainApplicationGroup }) => {
  const application = useApplication()

  const { currentPane } = application.accountMenuController

  const closeAccountMenu = useCallback(() => {
    application.accountMenuController.closeAccountMenu()
  }, [application])

  const setCurrentPane = useCallback(
    (pane: AccountMenuPane) => {
      application.accountMenuController.setCurrentPane(pane)
    },
    [application],
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
        mainApplicationGroup={mainApplicationGroup}
        menuPane={currentPane}
        setMenuPane={setCurrentPane}
        closeMenu={closeAccountMenu}
      />
    </div>
  )
}

export default observer(AccountMenu)
