import { Icon } from '@/components/Icon'
import { STRING_E2E_ENABLED, STRING_ENC_NOT_ENABLED, STRING_LOCAL_ENC_ENABLED } from '@/strings'
import { AppState } from '@/ui_models/app_state'
import { observer } from 'mobx-react-lite'
import { ComponentChild, FunctionComponent } from 'preact'
import { PreferencesGroup, PreferencesSegment, Text, Title } from '../../Components'

const formatCount = (count: number, itemType: string) => `${count} / ${count} ${itemType}`

const EncryptionStatusItem: FunctionComponent<{
  icon: ComponentChild
  status: string
}> = ({ icon, status }) => (
  <div className="w-full rounded py-1.5 px-3 text-input my-1 h-8 flex flex-row items-center bg-contrast no-border focus-within:ring-info">
    {icon}
    <div className="min-w-3 min-h-1" />
    <div className="flex-grow color-text text-sm">{status}</div>
    <div className="min-w-3 min-h-1" />
    <Icon className="success min-w-4 min-h-4" type="check-bold" />
  </div>
)

const EncryptionEnabled: FunctionComponent<{ appState: AppState }> = observer(({ appState }) => {
  const count = appState.accountMenu.structuredNotesAndTagsCount
  const notes = formatCount(count.notes, 'notes')
  const tags = formatCount(count.tags, 'tags')
  const archived = formatCount(count.archived, 'archived notes')
  const deleted = formatCount(count.deleted, 'trashed notes')

  const noteIcon = <Icon type="rich-text" className="min-w-5 min-h-5" />
  const tagIcon = <Icon type="hashtag" className="min-w-5 min-h-5" />
  const archiveIcon = <Icon type="archive" className="min-w-5 min-h-5" />
  const trashIcon = <Icon type="trash" className="min-w-5 min-h-5" />
  return (
    <>
      <div className="flex flex-row pb-1 pt-1.5">
        <EncryptionStatusItem status={notes} icon={[noteIcon]} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={tags} icon={[tagIcon]} />
      </div>
      <div className="flex flex-row">
        <EncryptionStatusItem status={archived} icon={[archiveIcon]} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={deleted} icon={[trashIcon]} />
      </div>
    </>
  )
})

export const Encryption: FunctionComponent<{ appState: AppState }> = observer(({ appState }) => {
  const app = appState.application
  const hasUser = app.hasAccount()
  const hasPasscode = app.hasPasscode()
  const isEncryptionEnabled = app.isEncryptionAvailable()

  const encryptionStatusString = hasUser
    ? STRING_E2E_ENABLED
    : hasPasscode
    ? STRING_LOCAL_ENC_ENABLED
    : STRING_ENC_NOT_ENABLED

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <Title>Encryption</Title>
        <Text>{encryptionStatusString}</Text>

        {isEncryptionEnabled && <EncryptionEnabled appState={appState} />}
      </PreferencesSegment>
    </PreferencesGroup>
  )
})
