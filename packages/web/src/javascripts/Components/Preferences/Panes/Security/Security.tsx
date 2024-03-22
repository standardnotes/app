import { NativeFeatureIdentifier, FeatureStatus } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useState } from 'react'

import { WebApplication } from '@/Application/WebApplication'
import Encryption from './Encryption'
import PasscodeLock from './PasscodeLock'
import Privacy from './Privacy'
import Protections from './Protections'
import ErroredItems from './ErroredItems'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import BiometricsLock from '@/Components/Preferences/Panes/Security/BiometricsLock'
import MultitaskingPrivacy from '@/Components/Preferences/Panes/Security/MultitaskingPrivacy'
import { TwoFactorAuth, is2FAEnabled as checkIf2FAIsEnabled } from './TwoFactorAuth/TwoFactorAuth'
import U2FView from './U2F/U2FView/U2FView'
import TwoFactorAuthView from './TwoFactorAuth/TwoFactorAuthView/TwoFactorAuthView'

interface SecurityProps {
  application: WebApplication
}

const Security: FunctionComponent<SecurityProps> = (props) => {
  const isNativeMobileWeb = props.application.isNativeMobileWeb()
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [canDisable2FA, setCanDisable2FA] = useState(true)

  const [auth] = useState(
    () =>
      new TwoFactorAuth(props.application.sessions, props.application.mfa, (status) =>
        setIs2FAEnabled(checkIf2FAIsEnabled(status)),
      ),
  )

  useEffect(() => {
    auth.fetchStatus()
  }, [auth])

  const onU2FDevicesLoaded = (devices: Array<{ id: string; name: string }>) => {
    setCanDisable2FA(devices.length === 0)
  }

  const isU2FFeatureAvailable =
    props.application.features.getFeatureStatus(
      NativeFeatureIdentifier.create(NativeFeatureIdentifier.TYPES.UniversalSecondFactor).getValue(),
    ) === FeatureStatus.Entitled && props.application.sessions.getUser() !== undefined

  return (
    <PreferencesPane>
      <Encryption />
      {props.application.items.invalidNonVaultedItems.length > 0 && <ErroredItems />}
      <Protections application={props.application} />
      <TwoFactorAuthView auth={auth} application={props.application} canDisable2FA={canDisable2FA} />
      {isU2FFeatureAvailable && (
        <U2FView
          application={props.application}
          is2FAEnabled={is2FAEnabled}
          loadAuthenticatorsCallback={onU2FDevicesLoaded}
        />
      )}
      {isNativeMobileWeb && <MultitaskingPrivacy application={props.application} />}
      <PasscodeLock application={props.application} />
      {isNativeMobileWeb && <BiometricsLock application={props.application} />}
      {props.application.sessions.getUser() && <Privacy application={props.application} />}
    </PreferencesPane>
  )
}

export default Security
