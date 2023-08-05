import { FunctionComponent, useState } from 'react'
import { MfaProps } from './MfaProps'
import { TwoFactorAuth } from './TwoFactorAuth'
import TwoFactorAuthView from './TwoFactorAuthView/TwoFactorAuthView'

const TwoFactorAuthWrapper: FunctionComponent<MfaProps> = (props) => {
  const [auth] = useState(() => new TwoFactorAuth(props.application.sessions, props.application.mfa))
  auth.fetchStatus()
  return <TwoFactorAuthView auth={auth} application={props.application} />
}

export default TwoFactorAuthWrapper
