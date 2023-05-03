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

type Props = {
  backupsService: BackupServiceInterface
}

const PlaintextBackupsDesktop = ({ backupsService }: Props) => {
  const [backupsEnabled, setBackupsEnabled] = useState(backupsService.isPlaintextBackupsEnabled())
  const [backupsLocation, setBackupsLocation] = useState(backupsService.getPlaintextBackupsLocation())

  const changeBackupsLocation = useCallback(async () => {
    const newLocation = await backupsService.changePlaintextBackupsLocation()
    setBackupsLocation(newLocation)
  }, [backupsService])

  const openBackupsLocation = useCallback(async () => {
    await backupsService.openPlaintextBackupsLocation()
  }, [backupsService])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      backupsService.disablePlaintextBackups()
    } else {
      await backupsService.enablePlaintextBackups()
    }

    setBackupsEnabled(backupsService.isPlaintextBackupsEnabled())
    setBackupsLocation(backupsService.getPlaintextBackupsLocation())
  }, [backupsEnabled, backupsService])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic plaintext backups</Title>

          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col">
              <Subtitle>
                Automatically save backups of all your notes to this computer into plaintext, non-encrypted folders.
              </Subtitle>
            </div>
            <Switch onChange={toggleBackups} checked={backupsEnabled} />
          </div>

          {!backupsEnabled && (
            <>
              <HorizontalSeparator classes="mt-2.5 mb-4" />
              <Text>Plaintext backups are not enabled. Enable to choose where your data is backed up.</Text>
            </>
          )}
        </PreferencesSegment>

        {backupsEnabled && (
          <>
            <HorizontalSeparator classes="my-4" />
            <PreferencesSegment>
              <>
                <Text className="mb-3">Plaintext backups are enabled and saved to:</Text>
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
      </PreferencesGroup>
    </>
  )
}

export default observer(PlaintextBackupsDesktop)
