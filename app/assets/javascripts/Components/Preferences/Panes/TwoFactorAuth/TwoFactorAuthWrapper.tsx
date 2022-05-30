import { FunctionComponent, useState } from 'react'
import { MfaProps } from './MfaProps'
import { TwoFactorAuth } from './TwoFactorAuth'
import TwoFactorAuthView from './TwoFactorAuthView/TwoFactorAuthView'

const TwoFactorAuthWrapper: FunctionComponent<MfaProps> = (props) => {
  const [auth] = useState(() => new TwoFactorAuth(props.mfaProvider, props.userProvider))
  auth.fetchStatus()
  return <TwoFactorAuthView auth={auth} />
}

export default TwoFactorAuthWrapper
