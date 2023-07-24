import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { useApplication } from '@/Components/ApplicationProvider'
import { SharedVaultPermission, SharedVaultListingInterface, TrustedContactInterface } from '@standardnotes/snjs'

type Props = {
  vault: SharedVaultListingInterface
  onCloseDialog: () => void
}

const ContactInviteModal: FunctionComponent<Props> = ({ vault, onCloseDialog }) => {
  const application = useApplication()

  const [selectedContacts, setSelectedContacts] = useState<TrustedContactInterface[]>([])
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])

  useEffect(() => {
    const loadContacts = async () => {
      const contacts = await application.vaultInvites.getInvitableContactsForSharedVault(vault)
      setContacts(contacts)
    }
    void loadContacts()
  }, [application.vaultInvites, vault])

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const inviteSelectedContacts = useCallback(async () => {
    for (const contact of selectedContacts) {
      await application.vaultInvites.inviteContactToSharedVault(vault, contact, SharedVaultPermission.Write)
    }
    handleDialogClose()
  }, [application.vaultInvites, vault, handleDialogClose, selectedContacts])

  const toggleContact = useCallback(
    (contact: TrustedContactInterface) => {
      if (selectedContacts.includes(contact)) {
        const index = selectedContacts.indexOf(contact)
        const updatedContacts = [...selectedContacts]
        updatedContacts.splice(index, 1)
        setSelectedContacts(updatedContacts)
      } else {
        setSelectedContacts([...selectedContacts, contact])
      }
    },
    [selectedContacts, setSelectedContacts],
  )

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Invite Selected Contacts',
        onClick: inviteSelectedContacts,
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
    [handleDialogClose, inviteSelectedContacts],
  )

  return (
    <Modal title="Add New Contact" close={handleDialogClose} actions={modalActions}>
      <div className="px-4.5 py-4">
        <div className="flex w-full flex-col">
          <div className="mb-3">
            {contacts.map((contact) => {
              return (
                <div key={contact.uuid} onClick={() => toggleContact(contact)}>
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact)}
                      onChange={() => toggleContact(contact)}
                    />
                  </div>
                  <div>
                    {contact.name}
                    {contact.contactUuid}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ContactInviteModal
