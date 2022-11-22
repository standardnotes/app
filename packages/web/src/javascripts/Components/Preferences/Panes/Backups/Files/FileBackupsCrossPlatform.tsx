import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/Application'
import { useMemo } from 'react'
import BackupsDropZone from './BackupsDropZone'
import FileBackupsDesktop from './FileBackupsDesktop'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

type Props = {
  application: WebApplication
}

const FileBackupsCrossPlatform = ({ application }: Props) => {
  const fileBackupsService = useMemo(() => application.fileBackups, [application])

  return fileBackupsService ? (
    <FileBackupsDesktop application={application} backupsService={fileBackupsService} />
  ) : (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>File Backups</Title>
          <Subtitle>Automatically save encrypted backups of files uploaded on any device to this computer.</Subtitle>
          <Text className="mt-3">To enable file backups, use the Standard Notes desktop application.</Text>
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <BackupsDropZone application={application} />
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default FileBackupsCrossPlatform
