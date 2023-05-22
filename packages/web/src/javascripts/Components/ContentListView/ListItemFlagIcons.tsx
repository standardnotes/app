import { FunctionComponent } from 'react'
import Icon from '@/Components/Icon/Icon'
import { ListableContentItem } from './Types/ListableContentItem'
import { classNames } from '@standardnotes/snjs'

type Props = {
  item: {
    locked: ListableContentItem['locked']
    trashed: ListableContentItem['trashed']
    archived: ListableContentItem['archived']
    pinned: ListableContentItem['pinned']
    starred: ListableContentItem['starred']
  }
  hasFiles?: boolean
  hasBorder?: boolean
  isFileBackedUp?: boolean
  className?: string
}

const ListItemFlagIcons: FunctionComponent<Props> = ({
  item,
  hasFiles = false,
  hasBorder = true,
  isFileBackedUp = false,
  className,
}) => {
  return (
    <div className={classNames('flex items-start pl-0', hasBorder && 'border-b border-solid border-border', className)}>
      {item.locked && (
        <span className="flex items-center" title="Editing Disabled">
          <Icon ariaLabel="Editing Disabled" type="pencil-off" className="text-info" size="medium" />
        </span>
      )}
      {item.trashed && (
        <span className="ml-1.5 flex items-center" title="Trashed">
          <Icon ariaLabel="Trashed" type="trash-filled" className="text-danger" size="medium" />
        </span>
      )}
      {item.archived && (
        <span className="ml-1.5 flex items-center" title="Archived">
          <Icon ariaLabel="Archived" type="archive" className="text-accessory-tint-3" size="medium" />
        </span>
      )}
      {hasFiles && (
        <span className="ml-1.5 flex items-center" title="Files">
          <Icon ariaLabel="Files" type="attachment-file" className="text-info" size="medium" />
        </span>
      )}
      {item.starred && (
        <span className="ml-1.5 flex items-center" title="Starred">
          <Icon ariaLabel="Starred" type="star-filled" className="text-warning" size="medium" />
        </span>
      )}
      {isFileBackedUp && (
        <span className="ml-1.5 flex items-center" title="File is backed up locally">
          <Icon ariaLabel="File is backed up locally" type="check-circle" className="text-info" size="medium" />
        </span>
      )}
    </div>
  )
}

export default ListItemFlagIcons
