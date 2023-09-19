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
import Dropdown from '@/Components/Dropdown/Dropdown'

type Props = {
  vault: SharedVaultListingInterface
  onCloseDialog: () => void
}

type SelectedContact = {
  uuid: string
  permission: keyof typeof SharedVaultUserPermission.PERMISSIONS
}

const ContactInviteModal: FunctionComponent<Props> = ({ vault, onCloseDialog }) => {
  const application = useApplication()

  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([])
  const [isLoadingContacts, setIsLoadingContacts] = useState(false)
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])
  const [isInvitingContacts, setIsInvitingContacts] = useState(false)

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
    setIsInvitingContacts(true)
    for (const selectedContact of selectedContacts) {
      const contact = contacts.find((contact) => contact.uuid === selectedContact.uuid)
      if (!contact) {
        continue
      }
      await application.vaultInvites.inviteContactToSharedVault(
        vault,
        contact,
        SharedVaultUserPermission.PERMISSIONS[selectedContact.permission],
      )
    }
    setIsInvitingContacts(false)
    handleDialogClose()
  }, [handleDialogClose, selectedContacts, contacts, application.vaultInvites, vault])

  const toggleContact = useCallback(
    (contact: TrustedContactInterface) => {
      const contactWithPermission: SelectedContact = {
        uuid: contact.uuid,
        permission: 'Read',
      }
      setSelectedContacts((selectedContacts) => {
        if (selectedContacts.find((c) => c.uuid === contact.uuid)) {
          return selectedContacts.filter((selectedContact) => selectedContact.uuid !== contact.uuid)
        } else {
          return [...selectedContacts, contactWithPermission]
        }
      })
    },
    [setSelectedContacts],
  )

  const modalActions = useMemo(
    (): ModalAction[] => [
      {
        label: isInvitingContacts ? <Spinner className="h-5 w-5 border-info-contrast" /> : 'Invite Selected Contacts',
        onClick: inviteSelectedContacts,
        type: 'primary',
        mobileSlot: 'right',
        disabled: isInvitingContacts,
        hidden: contacts.length === 0,
      },
      {
        label: 'Cancel',
        onClick: handleDialogClose,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [contacts.length, handleDialogClose, inviteSelectedContacts, isInvitingContacts],
  )

  return (
    <Modal title="Add New Contact" close={handleDialogClose} actions={modalActions}>
      <div className={classNames('flex w-full flex-col gap-3 px-4.5 py-4', isLoadingContacts && 'items-center')}>
        {isLoadingContacts ? (
          <Spinner className="h-5 w-5" />
        ) : contacts.length > 0 ? (
          contacts.map((contact) => {
            const selectedContact = selectedContacts.find((c) => c.uuid === contact.uuid)
            const isSelected = !!selectedContact

            return (
              <div
                className={classNames('grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5', isSelected && 'py-0.5')}
                key={contact.uuid}
              >
                <input
                  id={contact.uuid}
                  className="h-4 w-4 self-center accent-info"
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleContact(contact)}
                />
                <label htmlFor={contact.uuid} className="col-start-2">
                  <div className="text-sm font-semibold">{contact.name}</div>
                  <div className="opacity-90">{contact.contactUuid}</div>
                </label>
                {isSelected && (
                  <Dropdown
                    showLabel
                    label={'Permission:'}
                    classNameOverride={{
                      wrapper: 'col-start-2',
                    }}
                    items={Object.keys(SharedVaultUserPermission.PERMISSIONS).map((key) => ({
                      label: application.vaultUsers.getFormattedMemberPermission(key.toLowerCase()),
                      value: key,
                    }))}
                    value={selectedContact.permission}
                    onChange={(value) => {
                      setSelectedContacts((selectedContacts) =>
                        selectedContacts.map((c) => {
                          if (c.uuid === contact.uuid) {
                            return {
                              ...c,
                              permission: value as keyof typeof SharedVaultUserPermission.PERMISSIONS,
                            }
                          } else {
                            return c
                          }
                        }),
                      )
                    }}
                  />
                )}
              </div>
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
