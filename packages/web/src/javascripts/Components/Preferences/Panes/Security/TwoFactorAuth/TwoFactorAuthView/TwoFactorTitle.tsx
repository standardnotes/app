import { FunctionComponent } from 'react'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { TwoFactorAuth } from '../TwoFactorAuth'

type Props = {
  auth: TwoFactorAuth
}

const TwoFactorTitle: FunctionComponent<Props> = ({ auth }) => {
  if (!auth.isLoggedIn()) {
    return <Title>Two-factor authentication not available</Title>
  }

  return <Title>Two-factor authentication</Title>
}

export default observer(TwoFactorTitle)
