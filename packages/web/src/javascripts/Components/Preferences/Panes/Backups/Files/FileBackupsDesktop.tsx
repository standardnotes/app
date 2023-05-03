import { observer } from 'mobx-react-lite'
import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { useCallback, useState } from 'react'
import Button from '@/Components/Button/Button'
import Switch from '@/Components/Switch/Switch'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Icon from '@/Components/Icon/Icon'
import BackupsDropZone from './BackupsDropZone'
import EncryptionStatusItem from '../../Security/EncryptionStatusItem'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { BackupServiceInterface } from '@standardnotes/snjs'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  backupsService: BackupServiceInterface
}

const FileBackupsDesktop = ({ backupsService }: Props) => {
  const application = useApplication()
  const [backupsEnabled, setBackupsEnabled] = useState(backupsService.isFilesBackupsEnabled())
  const [backupsLocation, setBackupsLocation] = useState(backupsService.getFilesBackupsLocation())

  const changeBackupsLocation = useCallback(async () => {
    const newLocation = await backupsService.changeFilesBackupsLocation()
    setBackupsLocation(newLocation)
  }, [backupsService])

  const openBackupsLocation = useCallback(async () => {
    await backupsService.openFilesBackupsLocation()
  }, [backupsService])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      backupsService.disableFilesBackups()
    } else {
      await backupsService.enableFilesBackups()
    }

    setBackupsEnabled(backupsService.isFilesBackupsEnabled())
    setBackupsLocation(backupsService.getFilesBackupsLocation())
  }, [backupsService, backupsEnabled])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic file backups</Title>

          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col">
              <Subtitle>Automatically save encrypted backups of your uploaded files to this computer.</Subtitle>
            </div>
            <Switch onChange={toggleBackups} checked={backupsEnabled} />
          </div>

          {!backupsEnabled && (
            <>
              <HorizontalSeparator classes="mt-2.5 mb-4" />
              <Text>File backups are not enabled. Enable to choose where your files are backed up.</Text>
            </>
          )}
        </PreferencesSegment>

        {backupsEnabled && (
          <>
            <HorizontalSeparator classes="my-4" />

            <PreferencesSegment>
              <>
                <Text className="mb-3">
                  Files backups are enabled. When you upload a new file on any device and open this application, files
                  will be backed up in encrypted form to:
                </Text>

                <EncryptionStatusItem
                  status={backupsLocation || 'Not Set'}
                  icon={<Icon type="attachment-file" className="min-h-5 min-w-5" />}
                  checkmark={false}
                />

                <div className="mt-2.5 flex flex-row">
                  <Button label="Open Location" className={'mr-3 text-xs'} onClick={openBackupsLocation} />
                  <Button label="Change Location" className={'mr-3 text-xs'} onClick={changeBackupsLocation} />
                </div>
              </>
            </PreferencesSegment>
          </>
        )}

        <HorizontalSeparator classes="my-4" />

        <PreferencesSegment>
          <BackupsDropZone application={application} />
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(FileBackupsDesktop)
