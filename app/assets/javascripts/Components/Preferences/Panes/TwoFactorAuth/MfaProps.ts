import { MfaProvider, UserProvider } from '@/Components/Providers'

export interface MfaProps {
  userProvider: UserProvider
  mfaProvider: MfaProvider
}
