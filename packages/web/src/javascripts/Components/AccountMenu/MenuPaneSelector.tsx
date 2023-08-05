import { WebApplicationGroup } from '@/Application/WebApplicationGroup'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useState } from 'react'
import { AccountMenuPane } from './AccountMenuPane'
import ConfirmPassword from './ConfirmPassword'
import CreateAccount from './CreateAccount'
import GeneralAccountMenu from './GeneralAccountMenu'
import SignInPane from './SignIn'

type Props = {
  mainApplicationGroup: WebApplicationGroup
  menuPane: AccountMenuPane
  setMenuPane: (pane: AccountMenuPane) => void
  closeMenu: () => void
}

const MenuPaneSelector: FunctionComponent<Props> = ({ menuPane, setMenuPane, closeMenu, mainApplicationGroup }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  switch (menuPane) {
    case AccountMenuPane.GeneralMenu:
      return (
        <GeneralAccountMenu
          mainApplicationGroup={mainApplicationGroup}
          setMenuPane={setMenuPane}
          closeMenu={closeMenu}
        />
      )
    case AccountMenuPane.SignIn:
      return <SignInPane setMenuPane={setMenuPane} />
    case AccountMenuPane.Register:
      return (
        <CreateAccount
          setMenuPane={setMenuPane}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
        />
      )
    case AccountMenuPane.ConfirmPassword:
      return <ConfirmPassword setMenuPane={setMenuPane} email={email} password={password} />
  }
}

export default observer(MenuPaneSelector)
