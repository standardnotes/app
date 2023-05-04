import { WebApplication } from '@/Application/WebApplication'
import Spinner from '@/Components/Spinner/Spinner'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { SettingName } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useState } from 'react'
import { Subtitle, Title } from '../../PreferencesComponents/Content'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const FilesSection: FunctionComponent<Props> = ({ application }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [filesQuotaUsed, setFilesQuotaUsed] = useState<number>(0)
  const [filesQuotaTotal, setFilesQuotaTotal] = useState<number>(0)

  useEffect(() => {
    const getFilesQuota = async () => {
      const filesQuotaUsed = await application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesUsed).getValue(),
      )
      const filesQuotaTotal = await application.settings.getSubscriptionSetting(
        SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
      )

      if (filesQuotaUsed) {
        setFilesQuotaUsed(parseFloat(filesQuotaUsed))
      }
      if (filesQuotaTotal) {
        setFilesQuotaTotal(parseFloat(filesQuotaTotal))
      }

      setIsLoading(false)
    }

    getFilesQuota().catch(console.error)
  }, [application])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Files</Title>
        <Subtitle>Storage Quota</Subtitle>
        {isLoading ? (
          <div className="mt-2">
            <Spinner className="h-3 w-3" />
          </div>
        ) : (
          <>
            <div className="mt-1 mb-1">
              <span className="font-semibold">{formatSizeToReadableString(filesQuotaUsed)}</span> of{' '}
              <span>{formatSizeToReadableString(filesQuotaTotal)}</span> used
            </div>
            <progress
              className="progress-bar w-full"
              aria-label="Files storage used"
              value={filesQuotaUsed}
              max={filesQuotaTotal}
            />
          </>
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default FilesSection
