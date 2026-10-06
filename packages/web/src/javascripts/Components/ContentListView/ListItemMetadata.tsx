import { formatLastSyncDate, formatLastSyncDateForSentenceStart } from '@/Utils/LocalizedDateFormat'
import { CollectionSort, SortableItem } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { c } from 'ttag'
import { ListableContentItem } from './Types/ListableContentItem'

type Props = {
  item: {
    protected: ListableContentItem['protected']
    created_at: ListableContentItem['created_at']
    userModifiedDate: ListableContentItem['userModifiedDate']
  }
  hideDate: boolean
  sortBy: keyof SortableItem | undefined
}

const ListItemMetadata: FunctionComponent<Props> = ({ item, hideDate, sortBy }) => {
  const showModifiedDate = sortBy === CollectionSort.UpdatedAt

  const date = showModifiedDate ? item.userModifiedDate : item.created_at
  const formattedDate = date && (showModifiedDate ? formatLastSyncDate(date) : formatLastSyncDateForSentenceStart(date))

  if (hideDate && !item.protected) {
    return null
  }

  return (
    <div className="leading-1.4 mt-1 text-sm opacity-50 lg:text-xs">
      {item.protected && (
        <span>
          {c('B3.Notes.NoteList.Label').t`Protected`}
          {hideDate ? '' : ' • '}
        </span>
      )}
      {!hideDate && showModifiedDate && (
        <span>
          {c('B3.Notes.NoteList.Label').t`Modified`} {formattedDate || c('B3.Notes.NoteList.Label').t`Now`}
        </span>
      )}
      {!hideDate && !showModifiedDate && <span>{formattedDate || c('B3.Notes.NoteList.Label').t`Now`}</span>}
    </div>
  )
}

export default ListItemMetadata
