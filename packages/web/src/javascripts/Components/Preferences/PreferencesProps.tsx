import { WebApplication } from '@/Application/WebApplication'
import { MfaProps } from './Panes/Security/TwoFactorAuth/MfaProps'

export interface PreferencesProps extends MfaProps {
  application: WebApplication
  closePreferences: () => void
}
