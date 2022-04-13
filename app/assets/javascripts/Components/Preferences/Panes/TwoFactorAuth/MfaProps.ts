import { MfaProvider, UserProvider } from '@/Components/Preferences/Providers'

export interface MfaProps {
  userProvider: UserProvider
  mfaProvider: MfaProvider
}
