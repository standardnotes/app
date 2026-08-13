import { FunctionComponent } from 'react'
import { Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { observer } from 'mobx-react-lite'
import { TwoFactorAuth } from '../TwoFactorAuth'
import { c } from 'ttag'

type Props = {
  auth: TwoFactorAuth
}

const TwoFactorTitle: FunctionComponent<Props> = ({ auth }) => {
  if (!auth.isLoggedIn()) {
    return <Title>{c('B6.Preferences.Security.Title').t`Two-factor authentication not available`}</Title>
  }

  return <Title>{c('B6.Preferences.Security.Title').t`Two-factor authentication`}</Title>
}

export default observer(TwoFactorTitle)
