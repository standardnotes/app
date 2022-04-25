import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { SubscriptionSettingName } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { PreferencesGroup, PreferencesSegment, Subtitle, Title } from '../../PreferencesComponents'

type Props = {
  application: WebApplication
  appState: AppState
}

export const FilesSection: FunctionComponent<Props> = observer(({ application, appState }) => {
  if (!application.getUser() || !appState.features.isEntitledToFiles) {
    return null
  }

  const [isLoading, setIsLoading] = useState(true)
  const [filesQuotaUsed, setFilesQuotaUsed] = useState<number>(0)
  const [filesQuotaTotal, setFilesQuotaTotal] = useState<number>(0)

  useEffect(() => {
    const getFilesQuota = async () => {
      const filesQuotaUsed = await application.settings.getSubscriptionSetting(
        SubscriptionSettingName.FileUploadBytesUsed,
      )
      const filesQuotaTotal = await application.settings.getSubscriptionSetting(
        SubscriptionSettingName.FileUploadBytesLimit,
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
  })

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Files</Title>
        <Subtitle>Storage Quota</Subtitle>
        {isLoading ? (
          <div className="mt-2">
            <div className="sk-spinner spinner-info w-3 h-3"></div>
          </div>
        ) : (
          <>
            <div className="mt-1 mb-1">
              <span className="font-semibold">{formatSizeToReadableString(filesQuotaUsed)}</span> of{' '}
              <span>{formatSizeToReadableString(filesQuotaTotal)}</span> used
            </div>
            <progress
              className="w-full progress-bar"
              aria-label="Files storage used"
              value={filesQuotaUsed}
              max={filesQuotaTotal}
            />
          </>
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  )
})
