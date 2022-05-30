import { observer } from 'mobx-react-lite'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { AppState } from '@/UIModels/AppState'
import { WebApplication } from '@/UIModels/Application'
import { useCallback, useRef, FunctionComponent, KeyboardEventHandler } from 'react'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { AccountMenuPane } from './AccountMenuPane'
import MenuPaneSelector from './MenuPaneSelector'

type Props = {
  appState: AppState
  application: WebApplication
  onClickOutside: () => void
  mainApplicationGroup: ApplicationGroup
}

const AccountMenu: FunctionComponent<Props> = ({ application, appState, onClickOutside, mainApplicationGroup }) => {
  const { currentPane, shouldAnimateCloseMenu } = appState.accountMenu

  const closeAccountMenu = useCallback(() => {
    appState.accountMenu.closeAccountMenu()
  }, [appState])

  const setCurrentPane = useCallback(
    (pane: AccountMenuPane) => {
      appState.accountMenu.setCurrentPane(pane)
    },
    [appState],
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
        className={`sn-account-menu sn-dropdown ${
          shouldAnimateCloseMenu ? 'slide-up-animation' : 'sn-dropdown--animated'
        } min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto absolute`}
        onKeyDown={handleKeyDown}
      >
        <MenuPaneSelector
          appState={appState}
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
