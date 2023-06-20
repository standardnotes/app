import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import { TrustedContactInterface } from '@standardnotes/snjs'
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
    void application.contacts.deleteContact(contact)
  }, [application.contacts, contact])

  return (
    <>
      <ModalOverlay isOpen={isContactModalOpen} close={closeContactModal}>
        <EditContactModal editContactUuid={contact.uuid} onCloseDialog={closeContactModal} />
      </ModalOverlay>

      <div className="bg-gray-100 flex flex-row gap-3.5 rounded-lg py-2.5 px-3.5 shadow-md">
        <Icon type={'user'} size="custom" className="mt-2.5 h-5.5 w-5.5 flex-shrink-0" />
        <div className="flex flex-col gap-2 py-1.5">
          <span className="mr-auto overflow-hidden text-ellipsis text-base font-bold">{contact.name}</span>
          <span className="mr-auto overflow-hidden text-ellipsis text-sm">{collaborationID}</span>

          <div className="mt-2.5 flex flex-row">
            <Button label="Edit" className={'mr-3 text-xs'} onClick={() => setIsContactModalOpen(true)} />
            <Button label="Delete" className={'mr-3 text-xs'} onClick={deleteContact} />
          </div>
        </div>
      </div>
    </>
  )
}

export default ContactItem
