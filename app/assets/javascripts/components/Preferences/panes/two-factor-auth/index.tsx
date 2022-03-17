import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { MfaProps } from './MfaProps';
import { TwoFactorAuth } from './TwoFactorAuth';
import { TwoFactorAuthView } from './TwoFactorAuthView';

export const TwoFactorAuthWrapper: FunctionComponent<MfaProps> = (props) => {
  const [auth] = useState(
    () => new TwoFactorAuth(props.mfaProvider, props.userProvider)
  );
  auth.fetchStatus();
  return <TwoFactorAuthView auth={auth} />;
};
