import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { GroupServerHash } from '@standardnotes/snjs'
import { useState } from 'react'
import ContactInviteModal from '../Invites/ContactInviteModal'
import EditGroupModal from './EditGroupModal'

type Props = {
  group: GroupServerHash
}

const GroupItem = ({ group }: Props) => {
  const application = useApplication()
  const groupKey = application.groups.getGroupKey(group.uuid)

  const [isInviteModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeInviteModal = () => setIsAddContactModalOpen(false)

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const closeGroupModal = () => setIsGroupModalOpen(false)

  if (!groupKey) {
    return <div>Unable to locate group information.</div>
  }

  return (
    <>
      <ModalOverlay isOpen={isInviteModalOpen} close={closeInviteModal}>
        <ContactInviteModal group={group} onCloseDialog={closeInviteModal} />
      </ModalOverlay>

      <ModalOverlay isOpen={isGroupModalOpen} close={closeGroupModal}>
        <EditGroupModal existingGroupUuid={group.uuid} onCloseDialog={closeGroupModal} />
      </ModalOverlay>

      <div className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
        <Icon type={'share'} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-2 py-1.5">
          <span className="mr-auto overflow-hidden text-ellipsis text-base font-bold">{groupKey.groupName}</span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">{group.uuid}</span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">{groupKey.groupDescription}</span>

          <div className="mt-2.5 flex flex-row">
            <Button label="Edit" className={'mr-3 text-xs'} onClick={() => setIsGroupModalOpen(true)} />
            <Button label="Invite Contact" className={'mr-3 text-xs'} onClick={() => setIsAddContactModalOpen(true)} />
          </div>
        </div>
      </div>
    </>
  )
}

export default GroupItem
