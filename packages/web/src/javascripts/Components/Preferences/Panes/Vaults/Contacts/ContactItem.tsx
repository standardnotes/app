import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { TrustedContactInterface, classNames } from '@standardnotes/snjs'
import EditContactModal from './EditContactModal'
import { useCallback, useState } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'
import { VisuallyHidden } from '@ariakit/react'
import StyledTooltip from '@/Components/StyledTooltip/StyledTooltip'

type Props = {
  contact: TrustedContactInterface
}

const ContactItem = ({ contact }: Props) => {
  const application = useApplication()

  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const closeContactModal = () => setIsContactModalOpen(false)

  const collaborationID = application.contacts.getCollaborationIDForTrustedContact(contact)

  const deleteContact = useCallback(async () => {
    if (await application.alerts.confirm('Are you sure you want to delete this contact?')) {
      const result = await application.contacts.deleteContact(contact)
      if (result.isFailed()) {
        application.alerts
          .alertV2({
            text: result.getError(),
          })
          .catch(console.error)
      }
    }
  }, [application.alerts, application.contacts, contact])

  return (
    <>
      <ModalOverlay isOpen={isContactModalOpen} close={closeContactModal}>
        <EditContactModal editContactUuid={contact.contactUuid} onCloseDialog={closeContactModal} />
      </ModalOverlay>

      <div className="flex items-start gap-3.5 rounded-lg border border-border px-3.5 py-2.5 shadow-sm">
        <div className="grid grid-cols-[1fr,auto] grid-rows-2 place-items-center gap-x-3.5 gap-y-1 overflow-hidden">
          <Icon type="user" size="custom" className="h-5 w-5 flex-shrink-0" />
          <span
            className={classNames(
              'w-full overflow-hidden text-ellipsis text-base font-bold',
              contact.isMe ? 'text-info' : '',
            )}
          >
            {contact.name}
          </span>
          <span className="col-start-2 w-full overflow-hidden text-ellipsis text-sm brightness-75">
            {collaborationID}
          </span>
        </div>
        <div className="flex gap-3">
          <StyledTooltip label="Edit contact">
            <Button className="!px-2 py-2" onClick={() => setIsContactModalOpen(true)}>
              <VisuallyHidden>Edit</VisuallyHidden>
              <Icon type="pencil-filled" size="medium" />
            </Button>
          </StyledTooltip>
          {!contact.isMe && (
            <StyledTooltip label="Delete contact">
              <Button className="!px-2 py-2" onClick={deleteContact}>
                <VisuallyHidden>Delete</VisuallyHidden>
                <Icon type="trash-filled" className="text-danger" size="medium" />
              </Button>
            </StyledTooltip>
          )}
        </div>
      </div>
    </>
  )
}

export default ContactItem
