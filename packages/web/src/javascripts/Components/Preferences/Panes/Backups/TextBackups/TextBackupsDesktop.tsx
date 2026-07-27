import { observer } from 'mobx-react-lite'
import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { useCallback, useState } from 'react'
import Button from '@/Components/Button/Button'
import Switch from '@/Components/Switch/Switch'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Icon from '@/Components/Icon/Icon'
import EncryptionStatusItem from '../../Security/EncryptionStatusItem'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { BackupServiceInterface } from '@standardnotes/snjs'
import { useApplication } from '@/Components/ApplicationProvider'
import { c } from 'ttag'

type Props = {
  backupsService: BackupServiceInterface
}

const TextBackupsDesktop = ({ backupsService }: Props) => {
  const application = useApplication()
  const [backupsEnabled, setBackupsEnabled] = useState(backupsService.isTextBackupsEnabled())
  const [backupsLocation, setBackupsLocation] = useState(backupsService.getTextBackupsLocation())

  const changeBackupsLocation = useCallback(async () => {
    const newLocation = await backupsService.changeTextBackupsLocation()
    setBackupsLocation(newLocation)
  }, [backupsService])

  const openBackupsLocation = useCallback(async () => {
    await backupsService.openTextBackupsLocation()
  }, [backupsService])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      backupsService.disableTextBackups()
    } else {
      await backupsService.enableTextBackups()
    }

    setBackupsEnabled(backupsService.isTextBackupsEnabled())
    setBackupsLocation(backupsService.getTextBackupsLocation())
  }, [backupsEnabled, backupsService])

  const performBackup = useCallback(async () => {
    void application.desktopManager?.saveDesktopBackup()
  }, [application])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>{c('B6.Preferences.Backups.Title').t`Automatic Encrypted Text Backups`}</Title>

          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col">
              <Subtitle>
                {c('B6.Preferences.Backups.Subtitle')
                  .t`Automatically save encrypted text backups of all your note and tag data to this computer.`}
              </Subtitle>
            </div>
            <Switch onChange={toggleBackups} checked={backupsEnabled} />
          </div>

          {!backupsEnabled && (
            <>
              <HorizontalSeparator classes="mt-2.5 mb-4" />
              <Text>{c('B6.Preferences.Backups.Status')
                .t`Text backups are not enabled. Enable to choose where your data is backed up.`}</Text>
            </>
          )}
        </PreferencesSegment>

        {backupsEnabled && (
          <>
            <HorizontalSeparator classes="my-4" />

            <PreferencesSegment>
              <>
                <Text className="mb-3">{c('B6.Preferences.Backups.Status')
                  .t`Text backups are enabled and saved to:`}</Text>

                <EncryptionStatusItem
                  status={backupsLocation || 'Not Set'}
                  icon={<Icon type="attachment-file" className="min-h-5 min-w-5" />}
                  checkmark={false}
                />

                <div className="mt-2.5 flex flex-row">
                  <Button
                    label={c('B6.Preferences.Backups.Action').t`Open Location`}
                    className={'mr-3 text-xs'}
                    onClick={openBackupsLocation}
                  />
                  <Button
                    label={c('B6.Preferences.Backups.Action').t`Change Location`}
                    className={'mr-3 text-xs'}
                    onClick={changeBackupsLocation}
                  />
                </div>
              </>

              <HorizontalSeparator classes="my-4" />

              <Text className="mb-3">
                {c('B6.Preferences.Backups.Info')
                  .t`Backups are saved automatically throughout the day. You can perform a one-time backup now below.`}
              </Text>
              <div className="flex flex-row">
                <Button
                  label={c('B6.Preferences.Backups.Label').t`Perform Backup`}
                  className={'mr-3 text-xs'}
                  onClick={performBackup}
                />
              </div>
            </PreferencesSegment>
          </>
        )}
      </PreferencesGroup>
    </>
  )
}

export default observer(TextBackupsDesktop)
