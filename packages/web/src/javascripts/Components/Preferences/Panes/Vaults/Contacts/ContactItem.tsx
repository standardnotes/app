import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { TrustedContactInterface, classNames } from '@standardnotes/snjs'
import EditContactModal from './EditContactModal'
import { useCallback, useState } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'

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
      void application.contacts.deleteContact(contact)
    }
  }, [application.alerts, application.contacts, contact])

  return (
    <>
      <ModalOverlay isOpen={isContactModalOpen} close={closeContactModal}>
        <EditContactModal editContactUuid={contact.contactUuid} onCloseDialog={closeContactModal} />
      </ModalOverlay>

      <div className="flex flex-row gap-3.5 rounded-lg border border-border px-3.5 py-2.5 shadow-sm">
        <Icon type="user" size="custom" className="mt-2 h-5 w-5 flex-shrink-0" />
        <div className="flex flex-col gap-1 overflow-hidden py-1.5">
          <span
            className={classNames(
              'w-full overflow-hidden text-ellipsis text-base font-bold',
              contact.isMe ? 'text-info' : '',
            )}
          >
            {contact.name}
          </span>

          <span className="w-full overflow-hidden text-ellipsis text-sm">{collaborationID}</span>

          <div className="mt-1.5 flex flex-row">
            <Button label="Edit" className="mr-3" onClick={() => setIsContactModalOpen(true)} />
            {!contact.isMe && <Button label="Delete" className="mr-3" onClick={deleteContact} />}
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactItem
