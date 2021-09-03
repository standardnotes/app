import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { MfaProps } from './MfaProps';
import { TwoFactorAuth } from './TwoFactorAuth';
import { TwoFactorAuthView } from './TwoFactorAuthView';

export const TwoFactorAuthWrapper: FunctionComponent<MfaProps> = ({
  mfaGateway,
}) => {
  const [auth] = useState(() => new TwoFactorAuth(mfaGateway));
  auth.fetchStatus();
  return <TwoFactorAuthView auth={auth} />;
};
