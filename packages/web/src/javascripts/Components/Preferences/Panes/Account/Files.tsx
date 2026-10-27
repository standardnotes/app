import { WebApplication } from '@/Application/WebApplication'
import Spinner from '@/Components/Spinner/Spinner'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { SettingName } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useState } from 'react'
import { c, msgid } from 'ttag'
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
      if (filesQuotaUsed) {
        setFilesQuotaUsed(parseFloat(filesQuotaUsed))
      }

      if (application.sessions.isSignedIntoFirstPartyServer()) {
        const filesQuotaTotal = await application.settings.getSubscriptionSetting(
          SettingName.create(SettingName.NAMES.FileUploadBytesLimit).getValue(),
        )

        if (filesQuotaTotal) {
          setFilesQuotaTotal(parseFloat(filesQuotaTotal))
        }
      }

      setIsLoading(false)
    }

    getFilesQuota().catch(console.error)
  }, [application])

  const filesQuotaUsedLabel = formatSizeToReadableString(filesQuotaUsed)
  const filesQuotaTotalLabel = application.sessions.isSignedIntoFirstPartyServer()
    ? formatSizeToReadableString(filesQuotaTotal)
    : '∞'
  /** The plural form must follow the number shown to the user (e.g. "1 MB"), not the raw byte count */
  const filesQuotaUsedDisplayedAmount = parseFloat(filesQuotaUsedLabel)
  const filesQuotaText = c('B6.Preferences.Account.Info').ngettext(
    msgid`${filesQuotaUsedLabel} of ${filesQuotaTotalLabel} used`,
    `${filesQuotaUsedLabel} of ${filesQuotaTotalLabel} used`,
    filesQuotaUsedDisplayedAmount,
  )

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>{c('B6.Preferences.Account.Info').t`Files`}</Title>
        <Subtitle>{c('B6.Preferences.Account.Info').t`Storage Quota`}</Subtitle>
        {isLoading ? (
          <div className="mt-2">
            <Spinner className="h-3 w-3" />
          </div>
        ) : (
          <>
            <div className="mb-1 mt-1">
              {filesQuotaText}
            </div>
            <progress
              className="progress-bar w-full"
              aria-label={c('B6.Preferences.Account.Label').t`Files storage used`}
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
