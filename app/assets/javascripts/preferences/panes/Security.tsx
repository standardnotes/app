import { FunctionComponent } from 'preact';
import { PreferencesPane } from '../components';
import { TwoFactorAuthWrapper } from './two-factor-auth';
import { MfaProps } from './two-factor-auth/MfaProps';

interface SecurityProps extends MfaProps {}

export const Security: FunctionComponent<SecurityProps> = (props) => (
  <PreferencesPane>
    <TwoFactorAuthWrapper mfaGateway={props.mfaGateway} />
  </PreferencesPane>
);
