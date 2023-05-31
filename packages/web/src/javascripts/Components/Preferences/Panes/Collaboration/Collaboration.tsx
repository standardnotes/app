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
  GroupInviteServerHash,
  VaultInterface,
  TrustedContactInterface,
  isClientDisplayableError,
} from '@standardnotes/snjs'
import VaultItem from './Vaults/VaultItem'
import Button from '@/Components/Button/Button'
import InviteItem from './Invites/InviteItem'
import EditVaultModal from './Vaults/EditVaultModal'
import { VaultServiceEvent } from '@standardnotes/services'

const Collaboration = () => {
  const application = useApplication()

  const [vaults, setVaults] = useState<VaultInterface[]>([])
  const [invites, setInvites] = useState<GroupInviteServerHash[]>([])
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const closeVaultModal = () => setIsVaultModalOpen(false)

  const vaultService = application.vaults
  const contactService = application.contacts

  const fetchVaults = useCallback(async () => {
    const vaults = await application.vaults.reloadRemoteVaults()
    if (!isClientDisplayableError(vaults)) {
      setVaults(vaults)
    }
  }, [application.vaults])

  const fetchInvites = useCallback(async () => {
    await vaultService.downloadInboundInvites()
    const invites = vaultService.getCachedInboundInvites()
    setInvites(invites)
  }, [vaultService])

  const fetchContacts = useCallback(async () => {
    const contacts = contactService.getAllContacts()
    setContacts(contacts)
  }, [contactService])

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
    return vaultService.addEventObserver((event) => {
      if (event === VaultServiceEvent.VaultsChanged) {
        void fetchVaults()
        void fetchInvites()
      }
    })
  }, [fetchVaults, fetchInvites, vaultService])

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
              return <InviteItem invite={invite} key={invite.uuid} />
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
                label="Enable Collaboration"
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

export default observer(Collaboration)
