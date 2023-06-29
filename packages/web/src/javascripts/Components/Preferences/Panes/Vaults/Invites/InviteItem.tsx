import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { PendingSharedVaultInviteRecord } from '@standardnotes/snjs'
import { useCallback, useState } from 'react'
import EditContactModal from '../Contacts/EditContactModal'

type Props = {
  invite: PendingSharedVaultInviteRecord
}

const InviteItem = ({ invite }: Props) => {
  const application = useApplication()
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

  const isTrusted = invite.trusted
  const inviteData = invite.message.data

  const addAsTrustedContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  const acceptInvite = useCallback(async () => {
    await application.sharedVaults.acceptPendingSharedVaultInvite(invite)
  }, [application.sharedVaults, invite])

  const closeAddContactModal = () => setIsAddContactModalOpen(false)
  const collaborationId = application.contacts.getCollaborationIDFromInvite(invite.invite)

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <EditContactModal fromInvite={invite} onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <div className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
        <Icon type={'archive'} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-2 py-1.5">
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">Vault Name: {inviteData.metadata.name}</span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">
            Vault Description: {inviteData.metadata.description}
          </span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">
            Sender CollaborationID: {collaborationId}
          </span>

          <div className="mt-2.5 flex flex-row">
            {isTrusted ? (
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
        </div>
      </div>
    </>
  )
}

export default InviteItem
