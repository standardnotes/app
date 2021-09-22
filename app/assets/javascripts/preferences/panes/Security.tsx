import { AppState } from '@/ui_models/app_state';
import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { Encryption } from './Encryption';
import { TwoFactorAuthWrapper } from './two-factor-auth';
import { MfaProps } from './two-factor-auth/MfaProps';

interface SecurityProps extends MfaProps {
  appState: AppState;
}

export const Security: FunctionComponent<SecurityProps> = (props) => (
  <PreferencesPane>
    <Encryption appState={props.appState} />
    <TwoFactorAuthWrapper
      mfaProvider={props.mfaProvider}
      userProvider={props.userProvider}
    />
  </PreferencesPane>
);
