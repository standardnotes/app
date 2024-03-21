import { FunctionComponent } from 'react'

import { U2FProps } from './U2FProps'
import U2FView from './U2FView/U2FView'

const U2FWrapper: FunctionComponent<U2FProps> = (props) => {
  return (
    <U2FView
      application={props.application}
      is2FAEnabled={props.is2FAEnabled}
      loadAuthenticatorsCallback={props.loadAuthenticatorsCallback}
    />
  )
}

export default U2FWrapper
