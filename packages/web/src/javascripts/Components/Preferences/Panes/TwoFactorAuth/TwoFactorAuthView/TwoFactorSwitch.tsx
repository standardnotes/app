import { FunctionComponent } from 'react'
import Switch from '@/Components/Switch/Switch'
import { observer } from 'mobx-react-lite'
import { is2FADisabled, TwoFactorAuth } from '../TwoFactorAuth'

type Props = {
  auth: TwoFactorAuth
}

const TwoFactorSwitch: FunctionComponent<Props> = ({ auth }) => {
  if (!(auth.isLoggedIn() && auth.isMfaFeatureAvailable())) {
    return null
  }

  if (auth.status === 'fetching') {
    return <div className="sk-spinner normal info" />
  }

  return <Switch checked={!is2FADisabled(auth.status)} onChange={auth.toggle2FA} />
}

export default observer(TwoFactorSwitch)
