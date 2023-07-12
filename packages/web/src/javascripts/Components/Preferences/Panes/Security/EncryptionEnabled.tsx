import { useApplication } from '@/Components/ApplicationProvider'
import Icon from '@/Components/Icon/Icon'
import { ContentType, StaticItemCounter } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import EncryptionStatusItem from './EncryptionStatusItem'
import { formatCount } from './formatCount'

const EncryptionEnabled: FunctionComponent = () => {
  const application = useApplication()
  const itemCounter = new StaticItemCounter()
  const count = itemCounter.countNotesAndTags(
    application.items.getItems([ContentType.TYPES.Note, ContentType.TYPES.Tag]),
  )
  const files = application.items.getItems([ContentType.TYPES.File])
  const notes = formatCount(count.notes, 'notes')
  const tags = formatCount(count.tags, 'tags')
  const archived = formatCount(count.archived, 'archived notes')
  const deleted = formatCount(count.deleted, 'trashed notes')
  const filesCount = formatCount(files.length, 'files')

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
