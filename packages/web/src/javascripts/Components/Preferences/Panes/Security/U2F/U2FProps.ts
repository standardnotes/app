import { WebApplication } from '@/Application/Application'
import { UserProvider } from '@/Components/Preferences/Providers'

export interface U2FProps {
  userProvider: UserProvider
  application: WebApplication
}
