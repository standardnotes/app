import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'

import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { UserProvider } from '@/Components/Preferences/Providers'

type Props = {
  userProvider: UserProvider
}

const U2FDescription: FunctionComponent<Props> = ({ userProvider }) => {
  if (userProvider.getUser() === undefined) {
    return <Text>Sign in or register for an account to configure U2F.</Text>
  }

  return <Text>Authenticate with a U2F hardware device.</Text>
}

export default observer(U2FDescription)
