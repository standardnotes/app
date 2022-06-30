import { WebApplication } from '@/Application/Application'
import { MfaProps } from './Panes/Security/TwoFactorAuth/MfaProps'
import { ViewControllerManager } from '@/Services/ViewControllerManager'

export interface PreferencesProps extends MfaProps {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  closePreferences: () => void
}
