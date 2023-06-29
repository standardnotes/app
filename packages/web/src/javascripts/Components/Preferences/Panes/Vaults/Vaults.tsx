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
  SharedVaultServiceEvent,
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

  const updateVaults = useCallback(async () => {
    if (!application.vaults) {
      return
    }
    setVaults(application.vaults.getVaults())
  }, [application.vaults])

  const fetchInvites = useCallback(async () => {
    if (!application.sharedVaults) {
      return
    }

    await application.sharedVaults.downloadInboundInvites()
    const invites = application.sharedVaults.getCachedPendingInviteRecords()
    setInvites(invites)
  }, [application.sharedVaults])

  const updateContacts = useCallback(async () => {
    if (!application.contacts) {
      return
    }
    setContacts(application.contacts.getAllContacts())
  }, [application.contacts])

  useEffect(() => {
    if (!application.sharedVaults) {
      return
    }
    return application.sharedVaults.addEventObserver((event) => {
      if (event === SharedVaultServiceEvent.SharedVaultStatusChanged) {
        void fetchInvites()
      }
    })
  }, [application.sharedVaults, fetchInvites])

  useEffect(() => {
    return application.streamItems([ContentType.VaultListing, ContentType.TrustedContact], () => {
      void updateVaults()
      void fetchInvites()
      void updateContacts()
    })
  }, [application, updateVaults, fetchInvites, updateContacts])

  const createNewVault = useCallback(async () => {
    setIsVaultModalOpen(true)
  }, [])

  const createNewContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  useEffect(() => {
    return application.contacts?.addEventObserver((event) => {
      if (event === ContactServiceEvent.ContactsChanged) {
        void updateContacts()
      }
    })
  }, [application.contacts, updateContacts])

  useEffect(() => {
    void updateVaults()
    void fetchInvites()
    void updateContacts()
  }, [updateContacts, updateVaults, fetchInvites])

  if (!application.contacts) {
    return null
  }

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
          {application.contacts.isCollaborationEnabled() ? (
            <div className="mt-2.5 flex flex-row">
              <code>
                <pre>{application.contacts.getCollaborationID()}</pre>
              </code>
            </div>
          ) : (
            <div className="mt-2.5 flex flex-row">
              <Button
                label="Enable Vault Sharing"
                className={'mr-3 text-xs'}
                onClick={() => application.contacts?.enableCollaboration()}
              />
            </div>
          )}
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(Vaults)
