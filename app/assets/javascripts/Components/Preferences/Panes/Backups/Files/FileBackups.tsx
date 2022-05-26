import { WebApplication } from '@/UIModels/Application'
import { observer } from 'mobx-react-lite'
import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { useCallback, useEffect, useState } from 'react'
import Button from '@/Components/Button/Button'
import Switch from '@/Components/Switch/Switch'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Icon from '@/Components/Icon/Icon'
import BackupsDropZone from './BackupsDropZone'
import EncryptionStatusItem from '../../Security/EncryptionStatusItem'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
  backupsService: NonNullable<WebApplication['fileBackups']>
}

const FileBackups = ({ application, backupsService }: Props) => {
  const [backupsEnabled, setBackupsEnabled] = useState(false)
  const [backupsLocation, setBackupsLocation] = useState('')

  useEffect(() => {
    void backupsService.isFilesBackupsEnabled().then(setBackupsEnabled)
  }, [backupsService])

  useEffect(() => {
    if (backupsEnabled) {
      void backupsService.getFilesBackupsLocation().then(setBackupsLocation)
    }
  }, [backupsService, backupsEnabled])

  const changeBackupsLocation = useCallback(async () => {
    await backupsService.changeFilesBackupsLocation()

    setBackupsLocation(await backupsService.getFilesBackupsLocation())
  }, [backupsService])

  const openBackupsLocation = useCallback(async () => {
    await backupsService.openFilesBackupsLocation()
  }, [backupsService])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      await backupsService.disableFilesBackups()
    } else {
      await backupsService.enableFilesBackups()
    }

    setBackupsEnabled(await backupsService.isFilesBackupsEnabled())
  }, [backupsService, backupsEnabled])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>File Backups</Title>

          <div className="flex items-center justify-between">
            <div className="flex flex-col mr-10">
              <Subtitle>
                Automatically save encrypted backups of files uploaded on any device to this computer.
              </Subtitle>
            </div>
            <Switch onChange={toggleBackups} checked={backupsEnabled} />
          </div>

          {!backupsEnabled && (
            <>
              <HorizontalSeparator classes="mt-5 mb-4" />
              <Text>File backups are not enabled. Enable to choose where your files are backed up.</Text>
            </>
          )}
        </PreferencesSegment>

        {backupsEnabled && (
          <>
            <PreferencesSegment>
              <>
                <Text className="mb-3">
                  Files backups are enabled. When you upload a new file on any device and open this application, files
                  will be backed up in encrypted form to:
                </Text>

                <EncryptionStatusItem
                  status={backupsLocation}
                  icon={[<Icon type="attachment-file" className="min-w-5 min-h-5" />]}
                  checkmark={false}
                />

                <div className="flex flex-row mt-5">
                  <Button
                    variant="normal"
                    label="Open Backups Location"
                    className={'mr-3 text-xs'}
                    onClick={openBackupsLocation}
                  />
                  <Button
                    variant="normal"
                    label="Change Backups Location"
                    className={'mr-3 text-xs'}
                    onClick={changeBackupsLocation}
                  />
                </div>
              </>
            </PreferencesSegment>
          </>
        )}

        <PreferencesSegment>
          <BackupsDropZone application={application} />
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(FileBackups)
