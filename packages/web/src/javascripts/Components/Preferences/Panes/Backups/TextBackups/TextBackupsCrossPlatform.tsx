import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { WebApplication } from '@/Application/WebApplication'
import { useMemo } from 'react'
import TextBackupsDesktop from './TextBackupsDesktop'
import { AppName, jtString } from '@standardnotes/features'
import { c } from 'ttag'

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
          <Title>{c('B6.Preferences.Backups.Label').t`Automatic text backups`}</Title>
          <Subtitle>{c('B6.Preferences.Backups.Info')
            .t`Automatically save encrypted and decrypted backups of your note and tag data.`}</Subtitle>
          <Text className="mt-3">
            {jtString(
              c('B6.Preferences.Backups.Info').jt`To enable text backups, use the ${AppName} desktop application.`,
            )}
          </Text>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default TextBackupsCrossPlatform
