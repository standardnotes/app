import { WebApplication } from '@/Application/WebApplication'
import { TwoFactorAuth } from './TwoFactorAuth'

export interface MfaProps {
  application: WebApplication
  auth: TwoFactorAuth
  isDisabling2FAEnabled: boolean
}
