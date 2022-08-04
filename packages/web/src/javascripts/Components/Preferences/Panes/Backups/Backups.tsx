import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { FunctionComponent } from 'react'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import CloudLink from './CloudBackups/CloudBackups'
import DataBackups from './DataBackups'
import EmailBackups from './EmailBackups'
import FileBackupsCrossPlatform from './Files/FileBackupsCrossPlatform'
import { observer } from 'mobx-react-lite'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const Backups: FunctionComponent<Props> = ({ application, viewControllerManager }) => {
  return (
    <PreferencesPane>
      <DataBackups application={application} viewControllerManager={viewControllerManager} />
      <FileBackupsCrossPlatform application={application} />
      <EmailBackups application={application} />
      <CloudLink application={application} />
    </PreferencesPane>
  )
}

export default observer(Backups)
