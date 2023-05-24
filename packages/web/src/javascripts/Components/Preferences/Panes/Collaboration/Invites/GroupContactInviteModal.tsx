import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { useApplication } from '@/Components/ApplicationProvider'
import { GroupPermission, GroupServerHash, TrustedContactInterface } from '@standardnotes/snjs'

type Props = {
  group: GroupServerHash
  onCloseDialog: () => void
}

const GroupContactInviteModal: FunctionComponent<Props> = ({ group, onCloseDialog }) => {
  const application = useApplication()

  const [selectedContacts] = useState<TrustedContactInterface[]>([])
  const contacts = application.contacts.getAllContacts()

  const handleDialogClose = useCallback(() => {
    onCloseDialog()
  }, [onCloseDialog])

  const inviteSelectedContacts = useCallback(async () => {
    for (const contact of selectedContacts) {
      await application.groups.inviteContactToGroup(group, contact, GroupPermission.Write)
    }
    handleDialogClose()
  }, [application.groups, group, handleDialogClose, selectedContacts])

  const toggleContact = useCallback(
    (contact: TrustedContactInterface) => {
      if (selectedContacts.includes(contact)) {
        const index = selectedContacts.indexOf(contact)
        selectedContacts.splice(index, 1)
      } else {
        selectedContacts.push(contact)
      }
    },
    [selectedContacts],
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
                  {contact.name}
                  Selected: {selectedContacts.includes(contact) ? 'true' : 'false'}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default GroupContactInviteModal
