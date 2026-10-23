import { useApplication } from '@/Components/ApplicationProvider'
import Icon from '@/Components/Icon/Icon'
import { ContentType, StaticItemCounter } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import { c, msgid } from 'ttag'
import EncryptionStatusItem from './EncryptionStatusItem'

const EncryptionEnabled: FunctionComponent = () => {
  const application = useApplication()
  const itemCounter = new StaticItemCounter()
  const count = itemCounter.countNotesAndTags(
    application.items.getItems([ContentType.TYPES.Note, ContentType.TYPES.Tag]),
  )
  const files = application.items.getItems([ContentType.TYPES.File])
  const notesCount = count.notes
  const tagsCount = count.tags
  const archivedCount = count.archived
  const deletedCount = count.deleted
  const filesTotal = files.length

  const notes = c('B6.Preferences.Security.Label').ngettext(
    msgid`${notesCount} note`,
    `${notesCount} notes`,
    notesCount,
  )
  const tags = c('B6.Preferences.Security.Label').ngettext(msgid`${tagsCount} tag`, `${tagsCount} tags`, tagsCount)
  const archived = c('B6.Preferences.Security.Label').ngettext(
    msgid`${archivedCount} archived note`,
    `${archivedCount} archived notes`,
    archivedCount,
  )
  const deleted = c('B6.Preferences.Security.Label').ngettext(
    msgid`${deletedCount} trashed note`,
    `${deletedCount} trashed notes`,
    deletedCount,
  )
  const filesCount = c('B6.Preferences.Security.Label').ngettext(
    msgid`${filesTotal} file`,
    `${filesTotal} files`,
    filesTotal,
  )

  const noteIcon = <Icon type="rich-text" className="min-h-5 min-w-5" />
  const tagIcon = <Icon type="hashtag" className="min-h-5 min-w-5" />
  const archiveIcon = <Icon type="archive" className="min-h-5 min-w-5" />
  const trashIcon = <Icon type="trash" className="min-h-5 min-w-5" />
  const filesIcon = <Icon type="folder" className="min-h-5 min-w-5" />

  return (
    <>
      <div className="flex flex-row flex-wrap items-start pt-1.5 md:pb-1">
        <EncryptionStatusItem status={notes} icon={noteIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={filesCount} icon={filesIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={tags} icon={tagIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={archived} icon={archiveIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={deleted} icon={trashIcon} />
      </div>
    </>
  )
}

export default observer(EncryptionEnabled)
