import { FunctionComponent, useState } from 'react'
import { MfaProps } from './MfaProps'
import { U2FAuth } from './U2FAuth'
import U2FAuthView from './U2FView/U2FView'

const U2FAuthWrapper: FunctionComponent<MfaProps> = (props) => {
  const [auth] = useState(() => new U2FAuth(props.mfaProvider, props.userProvider))
  // auth.fetchStatus()
  return <U2FAuthView auth={auth} />
}

export default U2FAuthWrapper
