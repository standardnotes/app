import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { TwoFactorAuthWrapper } from './two-factor-auth';
import { MfaProps } from './two-factor-auth/MfaProps';

export const Security: FunctionComponent<MfaProps> = (props) => (
  <PreferencesPane>
    <TwoFactorAuthWrapper
      mfaProvider={props.mfaProvider}
      userProvider={props.userProvider}
    />
  </PreferencesPane>
);
