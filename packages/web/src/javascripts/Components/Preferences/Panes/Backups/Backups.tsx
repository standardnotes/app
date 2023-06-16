import { WebApplication } from '@/Application/WebApplication'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import PreferencesPane from '@/Components/Preferences/PreferencesComponents/PreferencesPane'
import DataBackups from './DataBackups'
import EmailBackups from './EmailBackups'
import FileBackupsCrossPlatform from './Files/FileBackupsCrossPlatform'
import { observer } from 'mobx-react-lite'
import TextBackupsCrossPlatform from './TextBackups/TextBackupsCrossPlatform'
import PlaintextBackupsCrossPlatform from './PlaintextBackups/PlaintextBackupsCrossPlatform'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const Backups: FunctionComponent<Props> = ({ application, viewControllerManager }) => {
  const [isUsingHomeServer, setIsUsingHomeServer] = useState(false)

  const checkIfApplicationUsesHomeServer = useCallback(async () => {
    setIsUsingHomeServer(await application.isUsingHomeServer())
  }, [application])

  useEffect(() => {
    void checkIfApplicationUsesHomeServer()
  }, [checkIfApplicationUsesHomeServer])

  return (
    <PreferencesPane>
      <DataBackups application={application} viewControllerManager={viewControllerManager} />
      <TextBackupsCrossPlatform application={application} />
      <PlaintextBackupsCrossPlatform />
      <FileBackupsCrossPlatform application={application} />
      {!isUsingHomeServer && <EmailBackups application={application} />}
    </PreferencesPane>
  )
}

export default observer(Backups)
