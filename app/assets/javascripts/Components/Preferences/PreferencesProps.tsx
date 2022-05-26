import { WebApplication } from '@/UIModels/Application'
import { MfaProps } from './Panes/TwoFactorAuth/MfaProps'
import { AppState } from '@/UIModels/AppState'

export interface PreferencesProps extends MfaProps {
  application: WebApplication
  appState: AppState
  closePreferences: () => void
}
