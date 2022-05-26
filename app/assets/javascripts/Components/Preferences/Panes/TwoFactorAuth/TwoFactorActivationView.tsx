import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { TwoFactorActivation } from './TwoFactorActivation'
import SaveSecretKey from './SaveSecretKey'
import ScanQRCode from './ScanQRCode'
import Verification from './Verification'
import TwoFactorSuccess from './TwoFactorSuccess'

type Props = {
  activation: TwoFactorActivation
}

const TwoFactorActivationView: FunctionComponent<Props> = ({ activation: act }) => {
  switch (act.activationStep) {
    case 'scan-qr-code':
      return <ScanQRCode activation={act} />
    case 'save-secret-key':
      return <SaveSecretKey activation={act} />
    case 'verification':
      return <Verification activation={act} />
    case 'success':
      return <TwoFactorSuccess activation={act} />
  }
}

export default observer(TwoFactorActivationView)
