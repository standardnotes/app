import { observer } from 'mobx-react-lite'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { AppState } from '@/UIModels/AppState'
import { WebApplication } from '@/UIModels/Application'
import { useCallback, useRef, useState } from 'preact/hooks'
import { GeneralAccountMenu } from './GeneralAccountMenu'
import { FunctionComponent } from 'preact'
import { SignInPane } from './SignIn'
import { CreateAccount } from './CreateAccount'
import { ConfirmPassword } from './ConfirmPassword'
import { JSXInternal } from 'preact/src/jsx'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'

export enum AccountMenuPane {
  GeneralMenu,
  SignIn,
  Register,
  ConfirmPassword,
}

type Props = {
  appState: AppState
  application: WebApplication
  onClickOutside: () => void
  mainApplicationGroup: ApplicationGroup
}

type PaneSelectorProps = {
  appState: AppState
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
  menuPane: AccountMenuPane
  setMenuPane: (pane: AccountMenuPane) => void
  closeMenu: () => void
}

const MenuPaneSelector: FunctionComponent<PaneSelectorProps> = observer(
  ({ application, appState, menuPane, setMenuPane, closeMenu, mainApplicationGroup }) => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    switch (menuPane) {
      case AccountMenuPane.GeneralMenu:
        return (
          <GeneralAccountMenu
            appState={appState}
            application={application}
            mainApplicationGroup={mainApplicationGroup}
            setMenuPane={setMenuPane}
            closeMenu={closeMenu}
          />
        )
      case AccountMenuPane.SignIn:
        return <SignInPane appState={appState} application={application} setMenuPane={setMenuPane} />
      case AccountMenuPane.Register:
        return (
          <CreateAccount
            appState={appState}
            application={application}
            setMenuPane={setMenuPane}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
          />
        )
      case AccountMenuPane.ConfirmPassword:
        return (
          <ConfirmPassword
            appState={appState}
            application={application}
            setMenuPane={setMenuPane}
            email={email}
            password={password}
          />
        )
    }
  },
)

export const AccountMenu: FunctionComponent<Props> = observer(
  ({ application, appState, onClickOutside, mainApplicationGroup }) => {
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

    const handleKeyDown: JSXInternal.KeyboardEventHandler<HTMLDivElement> = useCallback(
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
          className={`sn-menu-border sn-account-menu sn-dropdown ${
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
  },
)
