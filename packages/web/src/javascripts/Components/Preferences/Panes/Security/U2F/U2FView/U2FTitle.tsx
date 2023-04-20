import { FunctionComponent } from 'react'
import { observer } from 'mobx-react-lite'

import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { UserProvider } from '@/Components/Preferences/Providers'

type Props = {
  userProvider: UserProvider
}

const U2FTitle: FunctionComponent<Props> = ({ userProvider }) => {
  if (userProvider.getUser() === undefined) {
    return <Title>Hardware security key authentication not available</Title>
  }

  return <Title>Hardware Security Key Authentication</Title>
}

export default observer(U2FTitle)
