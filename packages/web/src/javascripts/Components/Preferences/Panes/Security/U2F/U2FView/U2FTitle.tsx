import { FunctionComponent } from 'react'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { U2FAuth } from '../U2FAuth'

type Props = {
  auth: U2FAuth
}

const U2FTitle: FunctionComponent<Props> = ({ auth }) => {
  if (!auth.isLoggedIn()) {
    return <Title>Universal 2nd Factor authentication not available</Title>
  }

  return <Title>Universal 2nd Factor authentication</Title>
}

export default observer(U2FTitle)
