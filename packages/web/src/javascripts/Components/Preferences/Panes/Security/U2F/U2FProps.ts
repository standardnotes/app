import { WebApplication } from '@/Application/WebApplication'
import { UserProvider } from '@/Components/Preferences/Providers'

export interface U2FProps {
  userProvider: UserProvider
  application: WebApplication
}
