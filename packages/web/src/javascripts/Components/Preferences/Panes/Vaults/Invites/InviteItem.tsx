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
    const result = await application.vaultInvites.acceptInvite(inviteRecord)
    if (result.isFailed()) {
      await application.alerts.alert(result.getError())
    }
  }, [application, inviteRecord])

  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const collaborationId = application.contacts.getCollaborationIDFromInvite(inviteRecord.invite)

  const trustedContact = application.contacts.findSenderContactForInvite(inviteRecord.invite)

  const permission = application.vaultUsers.getFormattedMemberPermission(inviteRecord.invite.permission)

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <EditContactModal fromInvite={inviteRecord} onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <div className="flex gap-3.5 rounded-lg border border-border px-3.5 py-2.5 shadow">
        <Icon type="archive" size="custom" className="mt-1.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-2 overflow-hidden py-1.5">
          <div className="overflow-hidden text-ellipsis text-sm">Vault Name: {inviteData.metadata.name}</div>
          {inviteData.metadata.description && (
            <div className="overflow-hidden text-ellipsis text-sm">
              Vault Description: {inviteData.metadata.description}
            </div>
          )}
          {trustedContact ? (
            <div className="flex items-center gap-1">
              <span className="overflow-hidden text-ellipsis text-sm">Trusted Sender: {trustedContact.name}</span>
              <CheckmarkCircle className="!h-4 !w-4" />
            </div>
          ) : (
            <div className="w-full overflow-hidden whitespace-pre-wrap break-words text-sm">
              Sender CollaborationID: <span className="font-mono text-xs">{collaborationId}</span>
            </div>
          )}
          <div className="overflow-hidden text-ellipsis text-sm">Permission: {permission}</div>
          <div className="">
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
