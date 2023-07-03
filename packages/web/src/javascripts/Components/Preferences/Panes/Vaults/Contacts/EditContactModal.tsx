import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import { PendingSharedVaultInviteRecord, TrustedContactInterface } from '@standardnotes/snjs'

type Props = {
  fromInvite?: PendingSharedVaultInviteRecord
  editContactUuid?: string
  onCloseDialog: () => void
  onAddContact?: (contact: TrustedContactInterface) => void
}

const EditContactModal: FunctionComponent<Props> = ({ onCloseDialog, fromInvite, onAddContact, editContactUuid }) => {
  const application = useApplication()

  const [name, setName] = useState<string>('')
  const [collaborationID, setCollaborationID] = useState<string>('')
  const [editingContact, setEditingContact] = useState<TrustedContactInterface | undefined>(undefined)

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  useEffect(() => {
    if (fromInvite) {
      setCollaborationID(application.contacts.getCollaborationIDFromInvite(fromInvite.invite))
    }
  }, [application.contacts, fromInvite])

  useEffect(() => {
    if (editContactUuid) {
      const contact = application.contacts.findTrustedContact(editContactUuid)
      if (!contact) {
        throw new Error(`Contact with uuid ${editContactUuid} not found`)
      }

      setEditingContact(contact)
      setName(contact.name)
      setCollaborationID(application.contacts.getCollaborationIDForTrustedContact(contact))
    }
  }, [application.contacts, application.vaults, editContactUuid])

  const handleSubmit = useCallback(async () => {
    if (editingContact) {
      void application.contacts.editTrustedContactFromCollaborationID(editingContact, { name, collaborationID })
      handleDialogClose()
    } else {
      const contact = await application.contacts.addTrustedContactFromCollaborationID(collaborationID, name)
      if (contact) {
        onAddContact?.(contact)
        handleDialogClose()
      } else {
        void application.alertService.alert('Unable to create contact. Please try again.')
      }
    }
  }, [
    editingContact,
    application.contacts,
    application.alertService,
    name,
    collaborationID,
    handleDialogClose,
    onAddContact,
  ])

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: editContactUuid ? 'Save Contact' : 'Add Contact',
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
    [editContactUuid, handleDialogClose, handleSubmit],
  )

  return (
    <Modal
      title={editContactUuid ? 'Edit Contact' : 'Add New Contact'}
      close={handleDialogClose}
      actions={modalActions}
    >
      <div className="px-4.5 pt-4 pb-1.5">
        <div className="flex w-full flex-col">
          <div className="mb-3">
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

            {!editContactUuid && (
              <p className="mt-4">
                Ask your contact for their Standard Notes CollaborationID via secure email or chat. Then, enter it here
                to add them as a contact.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EditContactModal
