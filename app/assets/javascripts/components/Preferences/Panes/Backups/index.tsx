import { WebApplication } from '@/ui_models/application'
import { AppState } from '@/ui_models/app_state'
import { FunctionComponent } from 'preact'
import { PreferencesPane } from '../../Components'
import { CloudLink } from './CloudBackups'
import { DataBackups } from './DataBackups'
import { EmailBackups } from './EmailBackups'

interface Props {
  appState: AppState
  application: WebApplication
}

export const Backups: FunctionComponent<Props> = ({ application, appState }) => {
  return (
    <PreferencesPane>
      <DataBackups application={application} appState={appState} />
      <EmailBackups application={application} />
      <CloudLink application={application} />
    </PreferencesPane>
  )
}
