import { MfaProvider, UserProvider } from '../../providers';

export interface MfaProps {
  userProvider: UserProvider;
  mfaProvider: MfaProvider;
}
