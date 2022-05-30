import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { FunctionComponent } from 'react'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import CloudLink from './CloudBackups/CloudBackups'
import DataBackups from './DataBackups'
import EmailBackups from './EmailBackups'
import FileBackupsCrossPlatform from './Files/FileBackupsCrossPlatform'
import { observer } from 'mobx-react-lite'

type Props = {
  appState: AppState
  application: WebApplication
}

const Backups: FunctionComponent<Props> = ({ application, appState }) => {
  return (
    <PreferencesPane>
      <DataBackups application={application} appState={appState} />
      <FileBackupsCrossPlatform application={application} />
      <EmailBackups application={application} />
      <CloudLink application={application} />
    </PreferencesPane>
  )
}

export default observer(Backups)
