import { WebApplication } from '@/Application/Application'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import ConfirmPassword from './ConfirmPassword'
import CreateAccount from './CreateAccount'
import GeneralAccountMenu from './GeneralAccountMenu'
import SignInPane from './SignIn'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
  mainApplicationGroup: ApplicationGroup
  menuPane: AccountMenuPane
  setMenuPane: (pane: AccountMenuPane) => void
  closeMenu: () => void
}

const MenuPaneSelector: FunctionComponent<Props> = ({
  application,
  viewControllerManager,
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
          viewControllerManager={viewControllerManager}
          application={application}
          mainApplicationGroup={mainApplicationGroup}
          setMenuPane={setMenuPane}
          closeMenu={closeMenu}
        />
      )
    case AccountMenuPane.SignIn:
      return (
        <SignInPane viewControllerManager={viewControllerManager} application={application} setMenuPane={setMenuPane} />
      )
    case AccountMenuPane.Register:
      return (
        <CreateAccount
          viewControllerManager={viewControllerManager}
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
          viewControllerManager={viewControllerManager}
          application={application}
          setMenuPane={setMenuPane}
          email={email}
          password={password}
        />
      )
  }
}

export default observer(MenuPaneSelector)
