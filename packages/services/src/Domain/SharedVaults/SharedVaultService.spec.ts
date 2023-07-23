import { GetVaultUsers } from './UseCase/GetVaultUsers'
import { RemoveVaultMember } from './UseCase/RemoveSharedVaultMember'
import { DeleteSharedVault } from './UseCase/DeleteSharedVault'
import { ConvertToSharedVault } from './UseCase/ConvertToSharedVault'
import { ShareContactWithVault } from './UseCase/ShareContactWithVault'
import { DeleteThirdPartyVault } from './UseCase/DeleteExternalSharedVault'
import { LeaveVault } from './UseCase/LeaveSharedVault'
import { InviteToVault } from './UseCase/InviteToVault'
import { AcceptVaultInvite } from './UseCase/AcceptVaultInvite'
import { GetVaultContacts } from './UseCase/GetVaultContacts'
import { GetAllContacts } from './../Contacts/UseCase/GetAllContacts'
import { FindContact } from './../Contacts/UseCase/FindContact'
import { GetUntrustedPayload } from './../AsymmetricMessage/UseCase/GetUntrustedPayload'
import { GetTrustedPayload } from './../AsymmetricMessage/UseCase/GetTrustedPayload'
import { SendVaultDataChangedMessage } from './UseCase/SendVaultDataChangedMessage'
import { NotifyVaultUsersOfKeyRotation } from './UseCase/NotifyVaultUsersOfKeyRotation'
import { HandleKeyPairChange } from './../Contacts/UseCase/HandleKeyPairChange'
import { CreateSharedVault } from './UseCase/CreateSharedVault'
import { GetVault } from './../Vaults/UseCase/GetVault'
import { SharedVaultInvitesServer } from '@standardnotes/api'
import { SharedVaultService } from './SharedVaultService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { VaultServiceInterface } from '../Vaults/VaultServiceInterface'
import { InternalEventBusInterface } from '../..'
import { ContactPublicKeySetInterface, TrustedContactInterface } from '@standardnotes/models'

describe('SharedVaultService', () => {
  let service: SharedVaultService

  beforeEach(() => {
    const sync = {} as jest.Mocked<SyncServiceInterface>
    sync.addEventObserver = jest.fn()

    const items = {} as jest.Mocked<ItemManagerInterface>
    items.addObserver = jest.fn()

    const encryption = {} as jest.Mocked<EncryptionProviderInterface>
    const session = {} as jest.Mocked<SessionsClientInterface>
    const vaults = {} as jest.Mocked<VaultServiceInterface>
    const invitesServer = {} as jest.Mocked<SharedVaultInvitesServer>
    const getVault = {} as jest.Mocked<GetVault>
    const createSharedVaultUseCase = {} as jest.Mocked<CreateSharedVault>
    const handleKeyPairChange = {} as jest.Mocked<HandleKeyPairChange>
    const notifyVaultUsersOfKeyRotation = {} as jest.Mocked<NotifyVaultUsersOfKeyRotation>
    const sendVaultDataChangeMessage = {} as jest.Mocked<SendVaultDataChangedMessage>
    const getTrustedPayload = {} as jest.Mocked<GetTrustedPayload>
    const getUntrustedPayload = {} as jest.Mocked<GetUntrustedPayload>
    const findContact = {} as jest.Mocked<FindContact>
    const getAllContacts = {} as jest.Mocked<GetAllContacts>
    const getVaultContacts = {} as jest.Mocked<GetVaultContacts>
    const acceptVaultInvite = {} as jest.Mocked<AcceptVaultInvite>
    const inviteToVault = {} as jest.Mocked<InviteToVault>
    const leaveVault = {} as jest.Mocked<LeaveVault>
    const deleteThirdPartyVault = {} as jest.Mocked<DeleteThirdPartyVault>
    const shareContactWithVault = {} as jest.Mocked<ShareContactWithVault>
    const convertToSharedVault = {} as jest.Mocked<ConvertToSharedVault>
    const deleteSharedVaultUseCase = {} as jest.Mocked<DeleteSharedVault>
    const removeVaultMember = {} as jest.Mocked<RemoveVaultMember>
    const getSharedVaultUsersUseCase = {} as jest.Mocked<GetVaultUsers>

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new SharedVaultService(
      sync,
      items,
      encryption,
      session,
      vaults,
      invitesServer,
      getVault,
      createSharedVaultUseCase,
      handleKeyPairChange,
      notifyVaultUsersOfKeyRotation,
      sendVaultDataChangeMessage,
      getTrustedPayload,
      getUntrustedPayload,
      findContact,
      getAllContacts,
      getVaultContacts,
      acceptVaultInvite,
      inviteToVault,
      leaveVault,
      deleteThirdPartyVault,
      shareContactWithVault,
      convertToSharedVault,
      deleteSharedVaultUseCase,
      removeVaultMember,
      getSharedVaultUsersUseCase,
      eventBus,
    )
  })

  describe('shareContactWithVaults', () => {
    it('should throw if attempting to share self contact', async () => {
      const contact = {
        name: 'Other',
        contactUuid: '456',
        publicKeySet: {} as ContactPublicKeySetInterface,
        isMe: true,
      } as jest.Mocked<TrustedContactInterface>

      await expect(service.shareContactWithVaults(contact)).rejects.toThrow('Cannot share self contact')
    })
  })
})
