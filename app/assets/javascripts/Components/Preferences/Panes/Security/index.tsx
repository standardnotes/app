import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { FunctionComponent } from 'preact'
import { PreferencesPane } from '@/Components/Preferences/PreferencesComponents'
import { TwoFactorAuthWrapper } from '../TwoFactorAuth'
import { MfaProps } from '../TwoFactorAuth/MfaProps'
import { Encryption } from './Encryption'
import { PasscodeLock } from './PasscodeLock'
import { Privacy } from './Privacy'
import { Protections } from './Protections'

interface SecurityProps extends MfaProps {
  appState: AppState
  application: WebApplication
}

export const Security: FunctionComponent<SecurityProps> = (props) => (
  <PreferencesPane>
    <Encryption appState={props.appState} />
    <Protections application={props.application} />
    <TwoFactorAuthWrapper mfaProvider={props.mfaProvider} userProvider={props.userProvider} />
    <PasscodeLock appState={props.appState} application={props.application} />
    {props.application.getUser() && <Privacy application={props.application} />}
  </PreferencesPane>
)
