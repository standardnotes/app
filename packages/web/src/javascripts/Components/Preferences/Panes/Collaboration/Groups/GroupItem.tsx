import { useApplication } from '@/Components/ApplicationProvider'
import Icon from '@/Components/Icon/Icon'
import { GroupServerHash } from '@standardnotes/snjs'

type Props = {
  group: GroupServerHash
}

const GroupItem = ({ group }: Props) => {
  const application = useApplication()
  const groupKey = application.groups.getGroupKey(group.uuid)

  if (!groupKey) {
    return <div>Unable to locate group information.</div>
  }

  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon type={'share'} size="custom" className="h-5.5 w-5.5 flex-shrink-0" />
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{group.uuid}</span>
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{groupKey.groupName}</span>
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{groupKey.groupDescription}</span>
    </div>
  )
}

export default GroupItem
