import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/Application'
import { useMemo } from 'react'
import PlaintextBackupsDesktop from './PlaintextBackupsDesktop'

type Props = {
  application: WebApplication
}

const PlaintextBackupsCrossPlatform = ({ application }: Props) => {
  const device = useMemo(() => application.desktopDevice, [application])
  const fileBackupsService = useMemo(() => application.fileBackups, [application])

  return fileBackupsService && device ? (
    <PlaintextBackupsDesktop device={device} backupsService={fileBackupsService} />
  ) : (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic Plaintext Backups</Title>
          <Subtitle>Automatically save backups of all your notes into plaintext, non-encrypted folders.</Subtitle>
          <Text className="mt-3">To enable plaintext backups, use the Standard Notes desktop application.</Text>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default PlaintextBackupsCrossPlatform
