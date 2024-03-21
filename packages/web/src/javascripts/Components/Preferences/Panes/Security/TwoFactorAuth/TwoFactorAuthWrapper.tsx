import { FunctionComponent } from 'react'

import { MfaProps } from './MfaProps'
import TwoFactorAuthView from './TwoFactorAuthView/TwoFactorAuthView'

const TwoFactorAuthWrapper: FunctionComponent<MfaProps> = (props) => {
  return (
    <TwoFactorAuthView
      auth={props.auth}
      application={props.application}
      isDisabling2FAEnabled={props.isDisabling2FAEnabled}
    />
  )
}

export default TwoFactorAuthWrapper
