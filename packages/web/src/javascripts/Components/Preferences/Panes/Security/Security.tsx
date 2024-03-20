import { NativeFeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent, useState } from 'react'

import { WebApplication } from '@/Application/WebApplication'
import TwoFactorAuthWrapper from './TwoFactorAuth/TwoFactorAuthWrapper'
import Encryption from './Encryption'
import PasscodeLock from './PasscodeLock'
import Privacy from './Privacy'
import Protections from './Protections'
import ErroredItems from './ErroredItems'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import BiometricsLock from '@/Components/Preferences/Panes/Security/BiometricsLock'
import MultitaskingPrivacy from '@/Components/Preferences/Panes/Security/MultitaskingPrivacy'
import U2FWrapper from './U2F/U2FWrapper'
import { TwoFactorAuth, is2FAEnabled as checkIf2FAIsEnabled } from './TwoFactorAuth/TwoFactorAuth'

interface SecurityProps {
  application: WebApplication
}

const Security: FunctionComponent<SecurityProps> = (props) => {
  const isNativeMobileWeb = props.application.isNativeMobileWeb()
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)

  const [auth] = useState(
    () =>
      new TwoFactorAuth(props.application.sessions, props.application.mfa, (status) =>
        setIs2FAEnabled(checkIf2FAIsEnabled(status)),
      ),
  )
  auth.fetchStatus()

  const isU2FFeatureAvailable =
    props.application.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.UniversalSecondFactor).getValue(),
    ) === FeatureStatus.Entitled && props.application.sessions.getUser() !== undefined

  return (
    <PreferencesPane>
      <Encryption />
      {props.application.items.invalidNonVaultedItems.length > 0 && <ErroredItems />}
      <Protections application={props.application} />
      <TwoFactorAuthWrapper auth={auth} application={props.application} />
      {isU2FFeatureAvailable && <U2FWrapper application={props.application} is2FAEnabled={is2FAEnabled} />}
      {isNativeMobileWeb && <MultitaskingPrivacy application={props.application} />}
      <PasscodeLock application={props.application} />
      {isNativeMobileWeb && <BiometricsLock application={props.application} />}
      {props.application.sessions.getUser() && <Privacy application={props.application} />}
    </PreferencesPane>
  )
}

export default Security
