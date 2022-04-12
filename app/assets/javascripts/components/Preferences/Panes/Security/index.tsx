import { WebApplication } from '@/ui_models/application'
import { AppState } from '@/ui_models/app_state'
import { FunctionComponent } from 'preact'
import { PreferencesPane } from '../../Components'
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
    <Privacy application={props.application} />
  </PreferencesPane>
)
