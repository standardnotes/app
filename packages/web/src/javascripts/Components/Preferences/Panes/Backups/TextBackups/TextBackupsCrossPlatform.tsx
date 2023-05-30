import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import { useMemo } from 'react'
import TextBackupsDesktop from './TextBackupsDesktop'

type Props = {
  application: WebApplication
}

const TextBackupsCrossPlatform = ({ application }: Props) => {
  const fileBackupsService = useMemo(() => application.fileBackups, [application])

  return fileBackupsService ? (
    <TextBackupsDesktop backupsService={fileBackupsService} />
  ) : (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Automatic text backups</Title>
          <Subtitle>Automatically save encrypted and decrypted backups of your note and tag data.</Subtitle>
          <Text className="mt-3">To enable text backups, use the Standard Notes desktop application.</Text>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default TextBackupsCrossPlatform
