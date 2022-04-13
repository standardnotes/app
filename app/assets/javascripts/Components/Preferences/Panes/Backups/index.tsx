import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { FunctionComponent } from 'preact'
import { PreferencesPane } from '@/Components/Preferences/PreferencesComponents'
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
