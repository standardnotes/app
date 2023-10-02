import { DiscardItemsLocally } from './../UseCase/DiscardItemsLocally'
import { InternalEventBusInterface } from './../Internal/InternalEventBusInterface'
import { GetOwnedSharedVaults } from './UseCase/GetOwnedSharedVaults'
import { DeleteSharedVault } from './UseCase/DeleteSharedVault'
import { ConvertToSharedVault } from './UseCase/ConvertToSharedVault'
import { ShareContactWithVault } from './UseCase/ShareContactWithVault'
import { DeleteThirdPartyVault } from './UseCase/DeleteExternalSharedVault'
import { FindContact } from './../Contacts/UseCase/FindContact'
import { HandleKeyPairChange } from './../Contacts/UseCase/HandleKeyPairChange'
import { CreateSharedVault } from './UseCase/CreateSharedVault'
import { GetVault } from './../Vault/UseCase/GetVault'
import { SharedVaultService } from './SharedVaultService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactPublicKeySetInterface, TrustedContactInterface } from '@standardnotes/models'
import { SyncLocalVaultsWithRemoteSharedVaults } from './UseCase/SyncLocalVaultsWithRemoteSharedVaults'
import { VaultUserServiceInterface } from '../VaultUser/VaultUserServiceInterface'

describe('SharedVaultService', () => {
  let service: SharedVaultService
  let syncLocalVaultsWithRemoteSharedVaults: SyncLocalVaultsWithRemoteSharedVaults

  beforeEach(() => {
    const sync = {} as jest.Mocked<SyncServiceInterface>
    sync.addEventObserver = jest.fn()

    const items = {} as jest.Mocked<ItemManagerInterface>
    items.addObserver = jest.fn()

    const vaultUsers = {} as jest.Mocked<VaultUserServiceInterface>

    const session = {} as jest.Mocked<SessionsClientInterface>
    const getVault = {} as jest.Mocked<GetVault>
    const getOwnedVaults = {} as jest.Mocked<GetOwnedSharedVaults>
    const createSharedVaultUseCase = {} as jest.Mocked<CreateSharedVault>
    const handleKeyPairChange = {} as jest.Mocked<HandleKeyPairChange>
    const findContact = {} as jest.Mocked<FindContact>
    const deleteThirdPartyVault = {} as jest.Mocked<DeleteThirdPartyVault>
    const shareContactWithVault = {} as jest.Mocked<ShareContactWithVault>
    const convertToSharedVault = {} as jest.Mocked<ConvertToSharedVault>
    const deleteSharedVaultUseCase = {} as jest.Mocked<DeleteSharedVault>
    const discardItemsLocally = {} as jest.Mocked<DiscardItemsLocally>

    syncLocalVaultsWithRemoteSharedVaults = {} as jest.Mocked<SyncLocalVaultsWithRemoteSharedVaults>
    syncLocalVaultsWithRemoteSharedVaults.execute = jest.fn()

    const eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.addEventHandler = jest.fn()

    service = new SharedVaultService(
      items,
      session,
      vaultUsers,
      syncLocalVaultsWithRemoteSharedVaults,
      getVault,
      getOwnedVaults,
      createSharedVaultUseCase,
      handleKeyPairChange,
      findContact,
      deleteThirdPartyVault,
      shareContactWithVault,
      convertToSharedVault,
      deleteSharedVaultUseCase,
      discardItemsLocally,
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
