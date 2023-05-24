import Icon from '@/Components/Icon/Icon'
import { GroupInviteServerHash } from '@standardnotes/snjs'

type Props = {
  invite: GroupInviteServerHash
}

const InviteItem = ({ invite }: Props) => {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <Icon type={'share'} size="custom" className="h-5.5 w-5.5 flex-shrink-0" />
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{invite.uuid}</span>
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{invite.inviter_public_key}</span>
      <span className="mr-auto overflow-hidden text-ellipsis text-sm">{invite.inviter_uuid}</span>
    </div>
  )
}

export default InviteItem
