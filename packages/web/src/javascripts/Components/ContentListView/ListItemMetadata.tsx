import { CollectionSort, SortableItem } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'

type Props = {
  item: {
    protected: ListableContentItem['protected']
    updatedAtString?: ListableContentItem['updatedAtString']
    createdAtString?: ListableContentItem['createdAtString']
  }
  hideDate: boolean
  sortBy: keyof SortableItem | undefined
}

const ListItemMetadata: FunctionComponent<Props> = ({ item, hideDate, sortBy }) => {
  const showModifiedDate = sortBy === CollectionSort.UpdatedAt

  if (hideDate && !item.protected) {
    return null
  }

  return (
    <div className="leading-1.4 mt-1 text-sm opacity-50 lg:text-xs">
      {item.protected && <span>Protected {hideDate ? '' : ' • '}</span>}
      {!hideDate && showModifiedDate && <span>Modified {item.updatedAtString || 'Now'}</span>}
      {!hideDate && !showModifiedDate && <span>{item.createdAtString || 'Now'}</span>}
    </div>
  )
}

export default ListItemMetadata
