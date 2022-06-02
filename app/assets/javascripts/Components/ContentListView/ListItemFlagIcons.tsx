import { FunctionComponent } from 'react'
import Icon from '@/Components/Icon/Icon'
import { ListableContentItem } from './Types/ListableContentItem'

type Props = {
  item: {
    locked: ListableContentItem['locked']
    trashed: ListableContentItem['trashed']
    archived: ListableContentItem['archived']
    pinned: ListableContentItem['pinned']
  }
  hasFiles?: boolean
}

const ListItemFlagIcons: FunctionComponent<Props> = ({ item, hasFiles = false }) => {
  return (
    <div className="flex items-start p-4 pl-0 border-0 border-b-1 border-solid border-main">
      {item.locked && (
        <span className="flex items-center" title="Editing Disabled">
          <Icon ariaLabel="Editing Disabled" type="pencil-off" className="sn-icon--small color-info" />
        </span>
      )}
      {item.trashed && (
        <span className="flex items-center ml-1.5" title="Trashed">
          <Icon ariaLabel="Trashed" type="trash-filled" className="sn-icon--small color-danger" />
        </span>
      )}
      {item.archived && (
        <span className="flex items-center ml-1.5" title="Archived">
          <Icon ariaLabel="Archived" type="archive" className="sn-icon--mid color-accessory-tint-3" />
        </span>
      )}
      {item.pinned && (
        <span className="flex items-center ml-1.5" title="Pinned">
          <Icon ariaLabel="Pinned" type="pin-filled" className="sn-icon--small color-info" />
        </span>
      )}
      {hasFiles && (
        <span className="flex items-center ml-1.5" title="Files">
          <Icon ariaLabel="Files" type="attachment-file" className="sn-icon--small color-info" />
        </span>
      )}
    </div>
  )
}

export default ListItemFlagIcons
