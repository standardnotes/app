import Icon from '@/Components/Icon/Icon'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { FunctionComponent } from 'react'
import EncryptionStatusItem from './EncryptionStatusItem'
import { formatCount } from './formatCount'

type Props = {
  viewControllerManager: ViewControllerManager
}

const EncryptionEnabled: FunctionComponent<Props> = ({ viewControllerManager }) => {
  const count = viewControllerManager.accountMenuController.structuredNotesAndTagsCount
  const notes = formatCount(count.notes, 'notes')
  const tags = formatCount(count.tags, 'tags')
  const archived = formatCount(count.archived, 'archived notes')
  const deleted = formatCount(count.deleted, 'trashed notes')

  const noteIcon = <Icon type="rich-text" className="min-h-5 min-w-5" />
  const tagIcon = <Icon type="hashtag" className="min-h-5 min-w-5" />
  const archiveIcon = <Icon type="archive" className="min-h-5 min-w-5" />
  const trashIcon = <Icon type="trash" className="min-h-5 min-w-5" />

  return (
    <>
      <div className="flex flex-row flex-wrap items-start pt-1.5 md:pb-1">
        <EncryptionStatusItem status={notes} icon={noteIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={tags} icon={tagIcon} />
      </div>
      <div className="flex flex-row flex-wrap items-start">
        <EncryptionStatusItem status={archived} icon={archiveIcon} />
        <div className="min-w-3" />
        <EncryptionStatusItem status={deleted} icon={trashIcon} />
      </div>
    </>
  )
}

export default observer(EncryptionEnabled)
