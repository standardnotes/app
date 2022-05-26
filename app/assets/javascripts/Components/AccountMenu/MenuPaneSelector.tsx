import { WebApplication } from '@/UIModels/Application'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import { ConfirmPassword } from './ConfirmPassword'
import { CreateAccount } from './CreateAccount'
import { GeneralAccountMenu } from './GeneralAccountMenu'
import { SignInPane } from './SignIn'

type Props = {
  appState: AppState
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
  menuPane: AccountMenuPane
  setMenuPane: (pane: AccountMenuPane) => void
  closeMenu: () => void
}

const MenuPaneSelector: FunctionComponent<Props> = ({
  application,
  appState,
  menuPane,
  setMenuPane,
  closeMenu,
  mainApplicationGroup,
}) => {
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
}

export default observer(MenuPaneSelector)
