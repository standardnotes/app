import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'

import { useMemo } from 'react'
import PlaintextBackupsDesktop from './PlaintextBackupsDesktop'
import { useApplication } from '@/Components/ApplicationProvider'

const PlaintextBackupsCrossPlatform = () => {
  const application = useApplication()
  const fileBackupsService = useMemo(() => application.fileBackups, [application])

  return fileBackupsService ? (
    <PlaintextBackupsDesktop backupsService={fileBackupsService} />
  ) : (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic plaintext backups</Title>
          <Subtitle>Automatically save backups of all your notes into plaintext, non-encrypted folders.</Subtitle>
          <Text className="mt-3">To enable plaintext backups, use the Standard Notes desktop application.</Text>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default PlaintextBackupsCrossPlatform
