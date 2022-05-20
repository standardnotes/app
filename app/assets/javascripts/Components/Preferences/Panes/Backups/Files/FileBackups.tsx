import { WebApplication } from '@/UIModels/Application'
import { observer } from 'mobx-react-lite'
import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
  Text,
  Subtitle,
} from '@/Components/Preferences/PreferencesComponents'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { Button } from '@/Components/Button/Button'
import { Switch } from '@/Components/Switch'
import { HorizontalSeparator } from '@/Components/Shared/HorizontalSeparator'
import { EncryptionStatusItem } from '../../Security/Encryption'
import { Icon } from '@/Components/Icon/Icon'
import { BackupsDropZone } from './BackupsDropZone'

type Props = {
  application: WebApplication
}

export const FileBackups = observer(({ application }: Props) => {
  const [backupsEnabled, setBackupsEnabled] = useState(false)
  const [backupsLocation, setBackupsLocation] = useState('')
  const backupsService = useMemo(() => application.fileBackups, [application])

  if (!backupsService) {
    return (
      <>
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>File Backups</Title>
            <Subtitle>Automatically save encrypted backups of files uploaded to any device to this computer.</Subtitle>
            <Text className="mt-3">To enable file backups, use the Standard Notes desktop application.</Text>
          </PreferencesSegment>
          <PreferencesSegment>
            <BackupsDropZone application={application} />
          </PreferencesSegment>
        </PreferencesGroup>
      </>
    )
  }

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
})
