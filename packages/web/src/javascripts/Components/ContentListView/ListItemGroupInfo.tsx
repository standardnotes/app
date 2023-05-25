import { FunctionComponent } from 'react'
import { ListableContentItem } from './Types/ListableContentItem'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'

type Props = {
  item: ListableContentItem
}

const ListItemGroupInfo: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()
  const groupInfo = application.groups.getGroupInfoForItem(item)

  if (!groupInfo) {
    return null
  }

  const groupNameDisplay = groupInfo.groupName || groupInfo.groupUuid.split('-')[0]

  return (
    <div className="mt-0.5 flex flex-wrap items-center">
      <div className={'mt-2 rounded bg-info py-1 px-1.5 text-danger-contrast'}>
        <span className="flex items-center" title="Archived">
          <Icon ariaLabel="Shared" type="share" className="mr-1 text-info-contrast" size="medium" />
          <div className="text-center text-xs font-bold">{groupNameDisplay}</div>
        </span>
      </div>
    </div>
  )
}

export default ListItemGroupInfo
