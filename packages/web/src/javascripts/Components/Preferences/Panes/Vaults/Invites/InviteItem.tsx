import { useApplication } from '@/Components/ApplicationProvider'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { InviteRecord } from '@standardnotes/snjs'
import { useCallback, useState } from 'react'
import EditContactModal from '../Contacts/EditContactModal'
import { CheckmarkCircle } from '../../../../UIElements/CheckmarkCircle'

type Props = {
  inviteRecord: InviteRecord
}

const InviteItem = ({ inviteRecord }: Props) => {
  const application = useApplication()
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)

  const isTrusted = inviteRecord.trusted
  const inviteData = inviteRecord.message.data

  const addAsTrustedContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  const acceptInvite = useCallback(async () => {
    await application.vaultInvites.acceptInvite(inviteRecord)
  }, [application, inviteRecord])

  const closeAddContactModal = () => setIsAddContactModalOpen(false)
  const collaborationId = application.contacts.getCollaborationIDFromInvite(inviteRecord.invite)

  const trustedContact = application.contacts.findContactForInvite(inviteRecord.invite)

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <EditContactModal fromInvite={inviteRecord} onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <div className="flex gap-3.5 rounded-lg px-3.5 py-2.5 border border-border shadow">
        <Icon type="archive" size="custom" className="mt-1.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-2 py-1.5 overflow-hidden">
          <div className="mr-auto overflow-hidden text-ellipsis text-sm">Vault Name: {inviteData.metadata.name}</div>
          {inviteData.metadata.description && (
            <div className="mr-auto overflow-hidden text-ellipsis text-sm">
              Vault Description: {inviteData.metadata.description}
            </div>
          )}
          {trustedContact ? (
            <div className="flex items-center gap-1">
              <span className="overflow-hidden text-ellipsis text-sm">Trusted Sender: {trustedContact.name}</span>
              <CheckmarkCircle className="!w-4 !h-4" />
            </div>
          ) : (
            <div className="mr-auto text-sm w-full whitespace-pre-wrap break-words overflow-hidden">
              Sender CollaborationID: <span className="text-xs font-mono">{collaborationId}</span>
            </div>
          )}

          <div className="mt-1.5">
            {isTrusted ? (
              <Button label="Accept Invite" className="text-xs" onClick={acceptInvite} />
            ) : (
              <div>
                <div>
                  The sender of this invite is not trusted. To accept this invite, first add the sender as a trusted
                  contact.
                </div>
                <Button label="Add Trusted Contact" className="mr-3 mt-2 text-xs" onClick={addAsTrustedContact} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default InviteItem
