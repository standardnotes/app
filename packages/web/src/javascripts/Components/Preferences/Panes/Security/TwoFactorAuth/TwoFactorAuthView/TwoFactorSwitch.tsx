import { FunctionComponent } from 'react'
import Switch from '@/Components/Switch/Switch'
import { observer } from 'mobx-react-lite'
import { is2FADisabled, TwoFactorAuth } from '../TwoFactorAuth'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  auth: TwoFactorAuth
}

const TwoFactorSwitch: FunctionComponent<Props> = ({ auth }) => {
  if (!(auth.isLoggedIn() && auth.isMfaFeatureAvailable())) {
    return null
  }

  if (auth.status === 'fetching') {
    return <Spinner className="h-4 w-4" />
  }

  return <Switch checked={!is2FADisabled(auth.status)} onChange={auth.toggle2FA} />
}

export default observer(TwoFactorSwitch)
