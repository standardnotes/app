import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'

type Props = {
  item: ListableContentItem
}

const ListItemCollaborationInfo: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()
  const groupInfo = application.groups.getGroupInfoForItem(item)

  if (!groupInfo) {
    return null
  }

  const groupNameDisplay = groupInfo.groupName || groupInfo.groupUuid.split('-')[0]
  const sharedByContact = application.groups.getItemSharedBy(item)

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-2">
      <div className={'mt-2 rounded bg-success py-1 px-1.5 text-danger-contrast'}>
        <span className="flex items-center" title="Shared in group">
          <Icon ariaLabel="Shared in group" type="group" className="mr-1 text-info-contrast" size="medium" />
          <div className="text-center text-xs font-bold">{groupNameDisplay}</div>
        </span>
      </div>

      {sharedByContact && (
        <div title="Shared by contact" className={'mt-2 rounded bg-info py-1 px-1.5 text-neutral-contrast'}>
          <span className="flex items-center" title="Shared by contact">
            <Icon ariaLabel="Shared by contact" type="archive" className="mr-1 text-info-contrast" size="medium" />
            <div className="text-center text-xs font-bold">{sharedByContact?.name}</div>
          </span>
        </div>
      )}
    </div>
  )
}

export default ListItemCollaborationInfo
