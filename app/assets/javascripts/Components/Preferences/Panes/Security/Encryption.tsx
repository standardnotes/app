import { Icon } from '@/Components/Icon/Icon'
import { STRING_E2E_ENABLED, STRING_ENC_NOT_ENABLED, STRING_LOCAL_ENC_ENABLED } from '@/Strings'
import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { PreferencesGroup, PreferencesSegment, Text, Title } from '@/Components/Preferences/PreferencesComponents'
import { EncryptionStatusItem } from './EncryptionStatusItem'

const formatCount = (count: number, itemType: string) => `${count} / ${count} ${itemType}`

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
      <div className="flex flex-row items-start pb-1 pt-1.5">
        <EncryptionStatusItem status={notes} icon={noteIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={tags} icon={tagIcon} />
      </div>
      <div className="flex flex-row items-start">
        <EncryptionStatusItem status={archived} icon={archiveIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={deleted} icon={trashIcon} />
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

EncryptionEnabled.displayName = 'EncryptionEnabled'
Encryption.displayName = 'Encryption'
