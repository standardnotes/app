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

type Props = {
  device: DesktopDeviceInterface
}

const TextBackupsDesktop = ({ device }: Props) => {
  const [backupsEnabled, setBackupsEnabled] = useState(false)
  const [backupsLocation, setBackupsLocation] = useState<string | undefined>('')

  useEffect(() => {
    void device.isLegacyTextBackupsEnabled().then(setBackupsEnabled)
  }, [device])

  useEffect(() => {
    if (backupsEnabled) {
      void device.getLegacyTextBackupsLocation().then(setBackupsLocation)
    }
  }, [device, backupsEnabled])

  const changeBackupsLocation = useCallback(async () => {
    await device.changeTextBackupsLocation()

    setBackupsLocation(await device.getLegacyTextBackupsLocation())
  }, [device])

  const openBackupsLocation = useCallback(async () => {
    await device.openTextBackupsLocation()
  }, [device])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      await device.disableTextBackups()
    } else {
      await device.enableTextBackups()
    }

    setBackupsEnabled(await device.isLegacyTextBackupsEnabled())
  }, [device, backupsEnabled])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic Text Backups</Title>

          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col">
              <Subtitle>Automatically save backups of all your note and tag data.</Subtitle>
            </div>
            <Switch onChange={toggleBackups} checked={backupsEnabled} />
          </div>

          {!backupsEnabled && (
            <>
              <HorizontalSeparator classes="mt-2.5 mb-4" />
              <Text>Text backups are not enabled. Enable to choose where your data is backed up.</Text>
            </>
          )}
        </PreferencesSegment>

        {backupsEnabled && (
          <>
            <HorizontalSeparator classes="my-4" />

            <PreferencesSegment>
              <>
                <Text className="mb-3">Text backups are enabled and saved to:</Text>

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

export default observer(TextBackupsDesktop)
