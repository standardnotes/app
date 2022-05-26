import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/UIModels/Application'
import { useMemo } from 'react'
import BackupsDropZone from './BackupsDropZone'
import FileBackups from './FileBackups'

type Props = {
  application: WebApplication
}

const FileBackupsWithFallback = ({ application }: Props) => {
  const fileBackupsService = useMemo(() => application.fileBackups, [application])

  return fileBackupsService ? (
    <FileBackups application={application} backupsService={fileBackupsService} />
  ) : (
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

export default FileBackupsWithFallback
