import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { Encryption, PasscodeLock, Protections, DataBackups } from './security-segments';
import { TwoFactorAuthWrapper } from './two-factor-auth';
import { MfaProps } from './two-factor-auth/MfaProps';

interface SecurityProps extends MfaProps {
  appState: AppState;
  application: WebApplication;
}

export const Security: FunctionComponent<SecurityProps> = (props) => (
  <PreferencesPane>
    <Encryption appState={props.appState} />
    <Protections application={props.application} />
    <TwoFactorAuthWrapper
      mfaProvider={props.mfaProvider}
      userProvider={props.userProvider}
    />
    <PasscodeLock appState={props.appState} application={props.application} />
    <DataBackups application={props.application} appState={props.appState} />
  </PreferencesPane>
);
