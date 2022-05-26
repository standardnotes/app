import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { FunctionComponent } from 'react'
import TwoFactorAuthWrapper from '../TwoFactorAuth/TwoFactorAuthWrapper'
import { MfaProps } from '../TwoFactorAuth/MfaProps'
import Encryption from './Encryption'
import PasscodeLock from './PasscodeLock'
import Privacy from './Privacy'
import Protections from './Protections'
import ErroredItems from './ErroredItems'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'

interface SecurityProps extends MfaProps {
  appState: AppState
  application: WebApplication
}

const Security: FunctionComponent<SecurityProps> = (props) => (
  <PreferencesPane>
    <Encryption appState={props.appState} />
    {props.application.items.invalidItems.length > 0 && <ErroredItems appState={props.appState} />}
    <Protections application={props.application} />
    <TwoFactorAuthWrapper mfaProvider={props.mfaProvider} userProvider={props.userProvider} />
    <PasscodeLock appState={props.appState} application={props.application} />
    {props.application.getUser() && <Privacy application={props.application} />}
  </PreferencesPane>
)

export default Security
