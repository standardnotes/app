import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { FunctionComponent } from 'react'
import TwoFactorAuthWrapper from './TwoFactorAuth/TwoFactorAuthWrapper'
import { MfaProps } from './TwoFactorAuth/MfaProps'
import Encryption from './Encryption'
import PasscodeLock from './PasscodeLock'
import Privacy from './Privacy'
import Protections from './Protections'
import ErroredItems from './ErroredItems'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import BiometricsLock from '@/Components/Preferences/Panes/Security/BiometricsLock'
import MultitaskingPrivacy from '@/Components/Preferences/Panes/Security/MultitaskingPrivacy'

interface SecurityProps extends MfaProps {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const SHOW_MULTITASKING_PRIVACY = false
const SHOW_BIOMETRICS_LOCK = false

const Security: FunctionComponent<SecurityProps> = (props) => {
  const isNativeMobileWeb = props.application.isNativeMobileWeb()

  return (
    <PreferencesPane>
      <Encryption viewControllerManager={props.viewControllerManager} />
      {props.application.items.invalidItems.length > 0 && (
        <ErroredItems viewControllerManager={props.viewControllerManager} />
      )}
      <Protections application={props.application} />
      <TwoFactorAuthWrapper mfaProvider={props.mfaProvider} userProvider={props.userProvider} />
      {SHOW_MULTITASKING_PRIVACY && isNativeMobileWeb && <MultitaskingPrivacy application={props.application} />}
      <PasscodeLock viewControllerManager={props.viewControllerManager} application={props.application} />
      {SHOW_BIOMETRICS_LOCK && isNativeMobileWeb && <BiometricsLock application={props.application} />}
      {props.application.getUser() && <Privacy application={props.application} />}
    </PreferencesPane>
  )
}

export default Security
