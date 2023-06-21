import { observer } from 'mobx-react-lite'
import { Subtitle, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesGroup from '@/Components/Preferences/PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import { useApplication } from '@/Components/ApplicationProvider'
import ContactItem from './Contacts/ContactItem'
import ModalOverlay from '@/Components/Modal/ModalOverlay'
import EditContactModal from './Contacts/EditContactModal'
import { useCallback, useEffect, useState } from 'react'
import {
  ContactServiceEvent,
  VaultListingInterface,
  TrustedContactInterface,
  PendingSharedVaultInviteRecord,
  ContentType,
} from '@standardnotes/snjs'
import VaultItem from './Vaults/VaultItem'
import Button from '@/Components/Button/Button'
import InviteItem from './Invites/InviteItem'
import EditVaultModal from './Vaults/VaultModal/EditVaultModal'

const Vaults = () => {
  const application = useApplication()

  const [vaults, setVaults] = useState<VaultListingInterface[]>([])
  const [invites, setInvites] = useState<PendingSharedVaultInviteRecord[]>([])
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const closeVaultModal = () => setIsVaultModalOpen(false)

  const vaultService = application.vaults
  const sharedVaultService = application.sharedVaults
  const contactService = application.contacts

  const fetchVaults = useCallback(async () => {
    setVaults(vaultService.getVaults())
  }, [vaultService])

  const fetchInvites = useCallback(async () => {
    await sharedVaultService.downloadInboundInvites()
    const invites = sharedVaultService.getCachedPendingInviteRecords()
    setInvites(invites)
  }, [sharedVaultService])

  const fetchContacts = useCallback(async () => {
    const contacts = contactService.getAllContacts()
    setContacts(contacts)
  }, [contactService])

  useEffect(() => {
    return application.streamItems([ContentType.VaultListing, ContentType.TrustedContact], () => {
      void fetchVaults()
      void fetchInvites()
      void fetchContacts()
    })
  }, [application, fetchVaults, fetchInvites, fetchContacts])

  const createNewVault = useCallback(async () => {
    setIsVaultModalOpen(true)
  }, [])

  const createNewContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  useEffect(() => {
    return contactService.addEventObserver((event) => {
      if (event === ContactServiceEvent.ContactsChanged) {
        void fetchContacts()
      }
    })
  }, [contactService, fetchContacts])

  useEffect(() => {
    void fetchVaults()
    void fetchInvites()
    void fetchContacts()
  }, [fetchContacts, fetchVaults, fetchInvites])

  return (
    <>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <EditContactModal onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <ModalOverlay isOpen={isVaultModalOpen} close={closeVaultModal}>
        <EditVaultModal onCloseDialog={closeVaultModal} />
      </ModalOverlay>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Incoming Invites</Title>
          <div className="my-2 flex flex-col">
            {invites.map((invite) => {
              return <InviteItem invite={invite} key={invite.invite.uuid} />
            })}
          </div>
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Contacts</Title>
          <div className="my-2 flex flex-col">
            {contacts.map((contact) => {
              return <ContactItem contact={contact} key={contact.uuid} />
            })}
          </div>
          <div className="mt-2.5 flex flex-row">
            <Button label="Add New Contact" className={'mr-3 text-xs'} onClick={createNewContact} />
          </div>
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Vaults</Title>
          <div className="my-2 flex flex-col">
            {vaults.map((vault) => {
              return <VaultItem vault={vault} key={vault.uuid} />
            })}
          </div>
          <div className="mt-2.5 flex flex-row">
            <Button label="Create New Vault" className={'mr-3 text-xs'} onClick={createNewVault} />
          </div>
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>CollaborationID</Title>
          <Subtitle>Share your CollaborationID with collaborators to join their vaults.</Subtitle>
          {contactService.isCollaborationEnabled() ? (
            <div className="mt-2.5 flex flex-row">
              <code>
                <pre>{contactService.getCollaborationID()}</pre>
              </code>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-row">
              <Button
                label="Enable Vault Sharing"
                className={'mr-3 text-xs'}
                onClick={() => contactService.enableCollaboration()}
              />
            </div>
          )}
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(Vaults)
