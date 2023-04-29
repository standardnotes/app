import { observer } from 'mobx-react-lite'
import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { useCallback, useEffect, useState } from 'react'
import Button from '@/Components/Button/Button'
import Switch from '@/Components/Switch/Switch'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Icon from '@/Components/Icon/Icon'
import EncryptionStatusItem from '../../Security/EncryptionStatusItem'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { DesktopDeviceInterface } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'

type Props = {
  device: DesktopDeviceInterface
  backupsService: NonNullable<WebApplication['fileBackups']>
}

const PlaintextBackupsDesktop = ({ device, backupsService }: Props) => {
  const [backupsEnabled, setBackupsEnabled] = useState(false)
  const [backupsLocation, setBackupsLocation] = useState<string | undefined>('')

  useEffect(() => {
    void device.isPlaintextBackupsEnabled().then(setBackupsEnabled)
  }, [device])

  useEffect(() => {
    if (backupsEnabled) {
      void device.getPlaintextBackupsLocation().then(setBackupsLocation)
    }
  }, [device, backupsEnabled])

  const changeBackupsLocation = useCallback(async () => {
    await device.changePlaintextBackupsLocation()

    setBackupsLocation(await device.getPlaintextBackupsLocation())
  }, [device])

  const openBackupsLocation = useCallback(async () => {
    await device.openPlaintextBackupsLocation()
  }, [device])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      await device.disablePlaintextBackups()
    } else {
      await backupsService.enablePlaintextBackups()
    }

    setBackupsEnabled(await device.isPlaintextBackupsEnabled())
  }, [device, backupsEnabled, backupsService])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic Plaintext Backups</Title>

          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col">
              <Subtitle>Automatically save backups of all your notes into plaintext, non-encrypted folders.</Subtitle>
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
