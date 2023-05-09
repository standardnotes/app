import { WebApplication } from '@/Application/WebApplication'
import { MfaProvider, UserProvider } from '@/Components/Preferences/Providers'

export interface MfaProps {
  userProvider: UserProvider
  mfaProvider: MfaProvider
  application: WebApplication
}
