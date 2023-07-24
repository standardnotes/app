import { InternalEventBusInterface } from './../Internal/InternalEventBusInterface'
import { GetOwnedSharedVaults } from './UseCase/GetOwnedSharedVaults'
import { IsVaultOwner } from './../VaultUser/UseCase/IsVaultOwner'
import { EncryptionProviderInterface } from './../Encryption/EncryptionProviderInterface'
import { DeleteSharedVault } from './UseCase/DeleteSharedVault'
import { ConvertToSharedVault } from './UseCase/ConvertToSharedVault'
import { ShareContactWithVault } from './UseCase/ShareContactWithVault'
import { DeleteThirdPartyVault } from './UseCase/DeleteExternalSharedVault'
import { FindContact } from './../Contacts/UseCase/FindContact'
import { SendVaultDataChangedMessage } from './UseCase/SendVaultDataChangedMessage'
import { NotifyVaultUsersOfKeyRotation } from './UseCase/NotifyVaultUsersOfKeyRotation'
import { HandleKeyPairChange } from './../Contacts/UseCase/HandleKeyPairChange'
import { CreateSharedVault } from './UseCase/CreateSharedVault'
import { GetVault } from './../Vaults/UseCase/GetVault'
import { SharedVaultService } from './SharedVaultService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
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
    const getVault = {} as jest.Mocked<GetVault>
    const getOwnedVaults = {} as jest.Mocked<GetOwnedSharedVaults>
    const createSharedVaultUseCase = {} as jest.Mocked<CreateSharedVault>
    const handleKeyPairChange = {} as jest.Mocked<HandleKeyPairChange>
    const notifyVaultUsersOfKeyRotation = {} as jest.Mocked<NotifyVaultUsersOfKeyRotation>
    const sendVaultDataChangeMessage = {} as jest.Mocked<SendVaultDataChangedMessage>
    const findContact = {} as jest.Mocked<FindContact>
    const deleteThirdPartyVault = {} as jest.Mocked<DeleteThirdPartyVault>
    const shareContactWithVault = {} as jest.Mocked<ShareContactWithVault>
    const convertToSharedVault = {} as jest.Mocked<ConvertToSharedVault>
    const deleteSharedVaultUseCase = {} as jest.Mocked<DeleteSharedVault>
    const isVaultAdmin = {} as jest.Mocked<IsVaultOwner>

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new SharedVaultService(
      items,
      encryption,
      session,
      getVault,
      getOwnedVaults,
      createSharedVaultUseCase,
      handleKeyPairChange,
      notifyVaultUsersOfKeyRotation,
      sendVaultDataChangeMessage,
      findContact,
      deleteThirdPartyVault,
      shareContactWithVault,
      convertToSharedVault,
      deleteSharedVaultUseCase,
      isVaultAdmin,
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
