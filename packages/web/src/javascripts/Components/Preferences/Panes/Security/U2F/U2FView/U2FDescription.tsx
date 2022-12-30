import { FunctionComponent } from 'react'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { U2FAuth } from '../U2FAuth'

type Props = {
  auth: U2FAuth
}

const U2FDescription: FunctionComponent<Props> = ({ auth }) => {
  if (!auth.isLoggedIn()) {
    return <Text>Sign in or register for an account to configure U2F.</Text>
  }

  return <Text>Authenticate with a U2F hardware device like an USB Security Key</Text>
}

export default observer(U2FDescription)
