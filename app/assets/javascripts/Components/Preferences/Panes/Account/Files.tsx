import { AppState } from '@/UIModels/AppState'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'preact'
import { PreferencesGroup, PreferencesSegment, Subtitle, Title } from '../../PreferencesComponents'

type Props = {
  appState: AppState
}

export const FilesSection: FunctionComponent<Props> = observer(({ appState }) => {
  if (!appState.features.isEntitledToFiles) {
    return null
  }

  const filesQuotaUsed = appState.files.filesQuotaUsed
  const filesQuotaTotal = appState.files.filesQuotaTotal

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Files</Title>
        <Subtitle>Storage Quota</Subtitle>
        <div className="mt-1 mb-1">
          <span className="font-semibold">{formatSizeToReadableString(filesQuotaUsed)}</span> of{' '}
          <span>{formatSizeToReadableString(filesQuotaTotal)}</span> used
        </div>
        <progress
          className="w-full progress-bar"
          aria-label="Files storage used"
          value={appState.files.filesQuotaUsed}
          max={filesQuotaTotal}
        />
      </PreferencesSegment>
    </PreferencesGroup>
  )
})
