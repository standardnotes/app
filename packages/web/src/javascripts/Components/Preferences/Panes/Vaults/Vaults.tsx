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
  InviteRecord,
  ContentType,
  SharedVaultServiceEvent,
  VaultUserServiceEvent,
  RoleName,
} from '@standardnotes/snjs'
import VaultItem from './Vaults/VaultItem'
import Button from '@/Components/Button/Button'
import InviteItem from './Invites/InviteItem'
import EditVaultModal from './Vaults/VaultModal/EditVaultModal'
import PreferencesPane from '../../PreferencesComponents/PreferencesPane'
import { ToastType, addToast } from '@standardnotes/toast'
import NoProSubscription from '../Account/NoProSubscription'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'

const Vaults = () => {
  const application = useApplication()

  const [vaults, setVaults] = useState<VaultListingInterface[]>([])
  const [canCreateMoreVaults, setCanCreateMoreVaults] = useState(true)
  const [invites, setInvites] = useState<InviteRecord[]>([])
  const [contacts, setContacts] = useState<TrustedContactInterface[]>([])

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false)
  const closeAddContactModal = () => setIsAddContactModalOpen(false)

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const closeVaultModal = () => setIsVaultModalOpen(false)

  const vaultService = application.vaults
  const contactService = application.contacts
  const featuresService = application.features

  const updateVaults = useCallback(async () => {
    const vaults = vaultService.getVaults()

    if (featuresService.hasMinimumRole(RoleName.NAMES.ProUser)) {
      setCanCreateMoreVaults(true)
    } else if (featuresService.hasMinimumRole(RoleName.NAMES.PlusUser)) {
      setCanCreateMoreVaults(vaults.length < 3)
    } else {
      setCanCreateMoreVaults(vaults.length < 1)
    }

    setVaults(vaults)
  }, [vaultService, featuresService])

  const updateInvites = useCallback(async () => {
    setInvites(application.vaultInvites.getCachedPendingInviteRecords())
  }, [application.vaultInvites])

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
    return application.sharedVaults.addEventObserver((event) => {
      if (event === SharedVaultServiceEvent.SharedVaultFileStorageUsageChanged) {
        void updateAllData()
      }
    })
  }, [application.sharedVaults, updateAllData])

  useEffect(() => {
    return application.vaultUsers.addEventObserver((event) => {
      if (event === VaultUserServiceEvent.UsersChanged) {
        void updateAllData()
      }
    })
  }, [application.vaultUsers, updateAllData])

  useEffect(() => {
    return application.vaultInvites.addEventObserver(() => {
      void updateAllData()
    })
  }, [application.vaultInvites, updateAllData])

  useEffect(() => {
    return application.items.streamItems([ContentType.TYPES.VaultListing, ContentType.TYPES.TrustedContact], () => {
      void updateAllData()
    })
  }, [application, updateAllData])

  useEffect(() => {
    void application.vaultInvites.downloadInboundInvites()
    void updateAllData()
  }, [updateAllData, application.vaultInvites])

  const createNewVault = useCallback(async () => {
    setIsVaultModalOpen(true)
  }, [])

  const createNewContact = useCallback(() => {
    setIsAddContactModalOpen(true)
  }, [])

  return (
    <PreferencesPane>
      <ModalOverlay isOpen={isAddContactModalOpen} close={closeAddContactModal}>
        <EditContactModal onCloseDialog={closeAddContactModal} />
      </ModalOverlay>

      <ModalOverlay isOpen={isVaultModalOpen} close={closeVaultModal}>
        <EditVaultModal onCloseDialog={closeVaultModal} />
      </ModalOverlay>

      {invites.length > 0 && (
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>Incoming Invites</Title>
            <div className="my-2 flex flex-col gap-3.5">
              {invites.map((invite) => {
                return <InviteItem inviteRecord={invite} key={invite.invite.uuid} />
              })}
            </div>
          </PreferencesSegment>
        </PreferencesGroup>
      )}

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Contacts</Title>
          <div className="my-2 flex flex-col gap-3.5">
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
          {vaults.length > 0 && (
            <div className="my-2 flex flex-col gap-3.5">
              {vaults.map((vault) => {
                return <VaultItem vault={vault} key={vault.uuid} />
              })}
            </div>
          )}
          {canCreateMoreVaults ? (
            <div className="mt-2.5 flex flex-row">
              <Button label="Create New Vault" className={'mr-3 text-xs'} onClick={createNewVault} />
            </div>
          ) : (
            <div>
              <HorizontalSeparator classes="my-4" />
              <NoProSubscription
                application={application}
                text={<span>Please upgrade in order to increase your shared vault limit.</span>}
              />
              <HorizontalSeparator classes="my-4" />
            </div>
          )}
        </PreferencesSegment>
      </PreferencesGroup>

      <PreferencesGroup>
        <PreferencesSegment>
          <Title>CollaborationID</Title>
          <Subtitle>Share your CollaborationID with collaborators to join their vaults.</Subtitle>
          {contactService.isCollaborationEnabled() ? (
            <>
              <code className="mt-2.5 overflow-hidden whitespace-pre-wrap break-words rounded border border-border bg-contrast p-3">
                {contactService.getCollaborationID()}
              </code>
              <Button
                label="Copy ID"
                className="mt-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(contactService.getCollaborationID())
                    addToast({
                      type: ToastType.Success,
                      message: 'Copied to clipboard',
                    })
                  } catch (error) {
                    addToast({
                      type: ToastType.Error,
                      message: 'Failed to copy to clipboard',
                    })
                    console.error(error)
                  }
                }}
              />
            </>
          ) : (
            <div className="mt-2.5 flex flex-row">
              <Button
                label="Enable Vault Sharing"
                className="mr-3 text-xs"
                onClick={() => contactService.enableCollaboration()}
              />
            </div>
          )}
        </PreferencesSegment>
      </PreferencesGroup>
    </PreferencesPane>
  )
}

export default observer(Vaults)
