import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import { GroupInviteServerHash, TrustedContactInterface } from '@standardnotes/snjs'

type Props = {
  fromInvite?: GroupInviteServerHash
  onCloseDialog: () => void
  onAddContact?: (contact: TrustedContactInterface) => void
}

const AddContact: FunctionComponent<Props> = ({ onCloseDialog, fromInvite, onAddContact }) => {
  const application = useApplication()

  const [collaborationID, setCollaborationID] = useState<string>('')
  const [name, setName] = useState<string>('')

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  useEffect(() => {
    if (fromInvite) {
      setCollaborationID(application.contacts.getCollaborationIDFromInvite(fromInvite))
    }
  }, [application.contacts, fromInvite])

  const handleSubmit = useCallback(async () => {
    const contact = await application.contacts.addTrustedContactFromCollaborationID(collaborationID, name)
    if (contact) {
      onAddContact?.(contact)
      handleDialogClose()
    } else {
      void application.alertService.alert('Unable to create contact. Please try again.')
    }
  }, [application.contacts, application.alertService, collaborationID, name, onAddContact, handleDialogClose])

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
              id="invite-name-input"
              value={name}
              placeholder="Contact Name"
              onChange={(value) => {
                setName(value)
              }}
            />

            <DecoratedInput
              className={{ container: 'mt-4' }}
              id="invite-email-input"
              value={collaborationID}
              placeholder="Contact CollaborationID"
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
