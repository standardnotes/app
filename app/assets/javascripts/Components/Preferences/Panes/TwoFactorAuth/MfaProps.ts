import { MfaProvider, UserProvider } from '../../Providers'

export interface MfaProps {
  userProvider: UserProvider
  mfaProvider: MfaProvider
}
