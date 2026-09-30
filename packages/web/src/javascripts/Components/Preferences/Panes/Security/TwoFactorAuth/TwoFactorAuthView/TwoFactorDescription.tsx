import { FunctionComponent } from 'react'
import { Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { TwoFactorAuth } from '../TwoFactorAuth'
import { c } from 'ttag'

type Props = {
  auth: TwoFactorAuth
}

const TwoFactorDescription: FunctionComponent<Props> = ({ auth }) => {
  if (!auth.isLoggedIn()) {
    return <Text>{c('B6.Preferences.Security.Info').t`Sign in or register for an account to configure 2FA.`}</Text>
  }

  return <Text>{c('B6.Preferences.Security.Info').t`An extra layer of security when logging in to your account.`}</Text>
}

export default observer(TwoFactorDescription)
