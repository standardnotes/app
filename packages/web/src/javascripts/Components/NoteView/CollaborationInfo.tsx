import { FunctionComponent } from 'react'
import Icon from '../Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import { DecryptedItemInterface } from '@standardnotes/snjs'

type Props = {
  item: DecryptedItemInterface
}

const CollaborationInfoHUD: FunctionComponent<Props> = ({ item }) => {
  const application = useApplication()

  const itemIsShared = application.groups.isItemInCollaborativeGroup(item)
  if (!itemIsShared) {
    return null
  }

  const lastEditedBy = application.groups.getItemLastEditedBy(item)
  const groupInfo = application.groups.getGroupInfoForItem(item)
  if (!groupInfo) {
    return null
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div title="Group name" className={'flex rounded bg-success py-1 px-1.5 text-success-contrast'}>
        <Icon ariaLabel="Shared in group" type="group" className="mr-1 text-info-contrast" size="medium" />
        <span className="mr-auto overflow-hidden text-ellipsis text-xs">{groupInfo.groupName}</span>
      </div>

      {lastEditedBy && (
        <div title="Last edited by" className={'flex rounded bg-info py-1 px-1.5 text-info-contrast'}>
          <Icon ariaLabel="Shared by" type="pencil" className="mr-1 text-info-contrast" size="medium" />
          <span className="mr-auto overflow-hidden text-ellipsis text-xs">{lastEditedBy?.name}</span>
        </div>
      )}
    </div>
  )
}

export default CollaborationInfoHUD
