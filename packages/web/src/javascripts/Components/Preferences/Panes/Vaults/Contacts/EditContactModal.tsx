import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { useApplication } from '@/Components/ApplicationProvider'
import { ClientDisplayableError, InviteRecord, TrustedContactInterface } from '@standardnotes/snjs'

type Props = {
  fromInvite?: InviteRecord
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
      const contact = application.contacts.findContact(editContactUuid)
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
      try {
        const contact = await application.contacts.addTrustedContactFromCollaborationID(collaborationID, name)
        if (contact) {
          onAddContact?.(contact)
          handleDialogClose()
        } else {
          void application.alerts.alert('Unable to create contact. Please try again.')
        }
      } catch (error) {
        if (error instanceof ClientDisplayableError) {
          application.alerts.showErrorAlert(error).catch(console.error)
        }
        console.error(error)
      }
    }
  }, [editingContact, application.contacts, application.alerts, name, collaborationID, handleDialogClose, onAddContact])

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

  const focusInput = useCallback((input: HTMLInputElement | null) => {
    if (input) {
      setTimeout(() => {
        input.focus()
      })
    }
  }, [])

  return (
    <Modal
      title={editContactUuid ? 'Edit Contact' : 'Add New Contact'}
      close={handleDialogClose}
      actions={modalActions}
    >
      <div className="mb-3 flex w-full flex-col gap-4 px-4.5 pb-1.5 pt-4">
        <label>
          <div className="mb-1">Contact Name</div>
          <DecoratedInput
            id="invite-name-input"
            value={name}
            onChange={(value) => {
              setName(value)
            }}
            ref={focusInput}
            onEnter={handleSubmit}
          />
        </label>

        {!editingContact?.isMe && (
          <label>
            <div className="mb-1">CollaborationID</div>
            <DecoratedInput
              id="invite-email-input"
              value={collaborationID}
              onChange={(value) => {
                setCollaborationID(value)
              }}
              onEnter={handleSubmit}
            />
          </label>
        )}

        {!editContactUuid && (
          <p>
            Ask your contact for their Standard Notes CollaborationID via secure email or chat. Then, enter it here to
            add them as a contact.
          </p>
        )}
      </div>
    </Modal>
  )
}

export default EditContactModal
