import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'

type Props = {
  onCloseDialog: () => void
}

const AddContact: FunctionComponent<Props> = ({ onCloseDialog }) => {
  const application = useApplication()

  const [collaborationID, setCollaborationID] = useState<string>('')

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const handleSubmit = useCallback(async () => {
    const contact = await application.contacts.addTrustedContactFromCollaborationID(collaborationID)
    if (contact) {
      handleDialogClose()
    } else {
      void application.alertService.alert('Unable to create contact. Please try again.')
    }
  }, [application.contacts, application.alertService, collaborationID, handleDialogClose])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Add Contact',
        onClick: handleSubmit,
        type: 'primary',
        mobileSlot: 'right',
      },
      {
        label: 'Cancel',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [handleDialogClose, handleSubmit],
  )

  return (
    <Modal title="Add New Contact" close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 py-4">
        <div className="flex w-full flex-col">
          <div className="mb-3">
            <label className="mb-1 block font-bold" htmlFor="invite-email-input">
              CollaborationID
            </label>

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="invite-email-input"
              onChange={(value) => {
                setCollaborationID(value)
              }}
            />

            <p className="mt-4">
              Ask your contact for their Standard Notes CollaborationID via secure email or chat. Then, enter it here to
              add them as a contact.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AddContact
