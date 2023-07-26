import { NativeFeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'

import { WebApplication } from '@/Application/WebApplication'
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
import U2FWrapper from './U2F/U2FWrapper'

interface SecurityProps extends MfaProps {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const Security: FunctionComponent<SecurityProps> = (props) => {
  const isNativeMobileWeb = props.application.isNativeMobileWeb()

  const isU2FFeatureAvailable =
    props.application.features.getFeatureStatus(NativeFeatureIdentifier.TYPES.UniversalSecondFactor) === FeatureStatus.Entitled &&
    props.userProvider.getUser() !== undefined

  return (
    <PreferencesPane>
      <Encryption viewControllerManager={props.viewControllerManager} />
      {props.application.items.invalidNonVaultedItems.length > 0 && <ErroredItems />}
      <Protections application={props.application} />
      <TwoFactorAuthWrapper
        mfaProvider={props.mfaProvider}
        userProvider={props.userProvider}
        application={props.application}
      />
      {isU2FFeatureAvailable && <U2FWrapper userProvider={props.userProvider} application={props.application} />}
      {isNativeMobileWeb && <MultitaskingPrivacy application={props.application} />}
      <PasscodeLock viewControllerManager={props.viewControllerManager} application={props.application} />
      {isNativeMobileWeb && <BiometricsLock application={props.application} />}
      {props.application.getUser() && <Privacy application={props.application} />}
    </PreferencesPane>
  )
}

export default Security
