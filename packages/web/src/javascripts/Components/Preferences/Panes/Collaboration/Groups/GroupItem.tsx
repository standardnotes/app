import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { GroupServerHash } from '@standardnotes/snjs'
import { useState } from 'react'
import ContactInviteModal from '../Invites/ContactInviteModal'

type Props = {
  group: GroupServerHash
}

const GroupItem = ({ group }: Props) => {
  const application = useApplication()
  const groupKey = application.groups.getGroupKey(group.uuid)

  const [isInviteModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeInviteModal = () => setIsAddContactModalOpen(false)

  if (!groupKey) {
    return <div>Unable to locate group information.</div>
  }

  return (
    <>
      <ModalOverlay isOpen={isInviteModalOpen} close={closeInviteModal}>
        <ContactInviteModal group={group} onCloseDialog={closeInviteModal} />
      </ModalOverlay>

      <div className="flex items-center gap-2 py-1.5">
        <Icon type={'share'} size="custom" className="h-5.5 w-5.5 flex-shrink-0" />
        <span className="mr-auto overflow-hidden text-ellipsis text-sm">{group.uuid}</span>
        <span className="mr-auto overflow-hidden text-ellipsis text-sm">{groupKey.groupName}</span>
        <span className="mr-auto overflow-hidden text-ellipsis text-sm">{groupKey.groupDescription}</span>

        <div className="mt-2.5 flex flex-row">
          <Button label="Invite Contact" className={'mr-3 text-xs'} onClick={() => setIsAddContactModalOpen(true)} />
        </div>
      </div>
    </>
  )
}

export default GroupItem
