import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { Encryption, PasscodeLock } from './security';
import { TwoFactorAuthWrapper } from './two-factor-auth';
import { MfaProps } from './two-factor-auth/MfaProps';

interface SecurityProps extends MfaProps {
  appState: AppState;
  application: WebApplication;
}

export const Security: FunctionComponent<SecurityProps> = (props) => (
  <PreferencesPane>
    <Encryption appState={props.appState} />
    <TwoFactorAuthWrapper
      mfaProvider={props.mfaProvider}
      userProvider={props.userProvider}
    />
    <PasscodeLock appState={props.appState} application={props.application} />
  </PreferencesPane>
);
