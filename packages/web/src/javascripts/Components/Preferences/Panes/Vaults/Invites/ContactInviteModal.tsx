import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { useApplication } from '@/Components/ApplicationProvider'
import {
  SharedVaultListingInterface,
  TrustedContactInterface,
  SharedVaultUserPermission,
  classNames,
} from '@standardnotes/snjs'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  vault: SharedVaultListingInterface
  onCloseDialog: () => void
}

const ContactInviteModal: FunctionComponent<Props> = ({ vault, onCloseDialog }) => {
  const application = useApplication()

  const [selectedContacts, setSelectedContacts] = useState<TrustedContactInterface[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])

  useEffect(() => {
    const loadContacts = async () => {
      setIsLoadingContacts(true)
      const contacts = await application.vaultInvites.getInvitableContactsForSharedVault(vault)
      setContacts(contacts)
      setIsLoadingContacts(false)
    }
    void loadContacts()
  }, [application.vaultInvites, vault])

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const inviteSelectedContacts = useCallback(async () => {
    for (const contact of selectedContacts) {
      await application.vaultInvites.inviteContactToSharedVault(
        vault,
        contact,
        SharedVaultUserPermission.PERMISSIONS.Write,
      )
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
      <div className={classNames('flex w-full flex-col gap-3 px-4.5 py-4', isLoadingContacts && 'items-center')}>
        {isLoadingContacts ? (
          <Spinner className="h-5 w-5" />
        ) : contacts.length > 0 ? (
          contacts.map((contact) => {
            return (
              <label className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5" key={contact.uuid}>
                <input
                  className="h-4 w-4 self-center accent-info"
                  type="checkbox"
                  checked={selectedContacts.includes(contact)}
                  onChange={() => toggleContact(contact)}
                />
                <div className="col-start-2 text-sm font-semibold">{contact.name}</div>
                <div className="col-start-2">{contact.contactUuid}</div>
              </label>
            )
          })
        ) : (
          <div className="text-sm">No contacts available to invite.</div>
        )}
      </div>
    </Modal>
  )
}

export default ContactInviteModal
