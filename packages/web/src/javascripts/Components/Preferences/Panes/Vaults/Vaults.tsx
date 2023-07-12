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

  const vaultService = application.vaults
  const sharedVaultService = application.sharedVaults
  const contactService = application.contacts

  const updateVaults = useCallback(async () => {
    setVaults(vaultService.getVaults())
  }, [vaultService])

  const updateInvites = useCallback(async () => {
    setInvites(sharedVaultService.getCachedPendingInviteRecords())
  }, [sharedVaultService])

  const updateContacts = useCallback(async () => {
    setContacts(contactService.getAllContacts())
  }, [contactService])

  const updateAllData = useCallback(async () => {
    await Promise.all([updateVaults(), updateInvites(), updateContacts()])
  }, [updateContacts, updateInvites, updateVaults])

  useEffect(() => {
    return application.sharedVaults.addEventObserver((event) => {
      if (event === SharedVaultServiceEvent.SharedVaultStatusChanged) {
        void updateAllData()
      }
    })
  }, [application.sharedVaults, updateAllData])

  useEffect(() => {
    return application.streamItems([ContentType.VaultListing, ContentType.TrustedContact], () => {
      void updateAllData()
    })
  }, [application, updateAllData])

  useEffect(() => {
    void sharedVaultService.downloadInboundInvites()
    void updateAllData()
  }, [updateAllData, sharedVaultService])

  const createNewVault = useCallback(async () => {
    setIsVaultModalOpen(true)
  }, [])

  const createNewContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

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
              return <InviteItem inviteRecord={invite} key={invite.invite.uuid} />
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
