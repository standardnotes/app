import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { GroupInviteServerHash } from '@standardnotes/snjs'
import { useCallback, useState } from 'react'
import AddContact from '../Contacts/AddContact'

type Props = {
  invite: GroupInviteServerHash
}

const InviteItem = ({ invite }: Props) => {
  const application = useApplication()
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

  const isInviteTrusted = application.groups.isInviteTrusted(invite)

  const addAsTrustedContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  const acceptInvite = useCallback(async () => {
    await application.groups.acceptInvite(invite)
  }, [application.groups, invite])

  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <AddContact fromInvite={invite} onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <div className="flex items-center gap-2 py-1.5">
        <Icon type={'share'} size="custom" className="h-5.5 w-5.5 flex-shrink-0" />
        <span className="mr-auto overflow-hidden text-ellipsis text-sm">UUID: {invite.uuid}</span>
        <span className="mr-auto overflow-hidden text-ellipsis text-sm">Public Key: {invite.inviter_public_key}</span>
        <span className="mr-auto overflow-hidden text-ellipsis text-sm">Inviter UUID: {invite.inviter_uuid}</span>
      </div>

      <div className="mt-2.5 flex flex-row">
        {isInviteTrusted ? (
          <Button label="Accept Invite" className={'mr-3 text-xs'} onClick={acceptInvite} />
        ) : (
          <div>
            <div>
              The sender of this invite is not trusted. To accept this invite, first add the sender as a trusted
              contact.
            </div>
            <Button label="Add Trusted Contact" className={'mr-3 text-xs'} onClick={addAsTrustedContact} />
          </div>
        )}
      </div>
    </>
  )
}

export default InviteItem
