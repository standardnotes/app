import { HttpService } from '@standardnotes/api'
import { SharedVaultService } from './SharedVaultService'
import { SyncServiceInterface } from '../Sync/SyncServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { MutatorClientInterface } from '../Mutator/MutatorClientInterface'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { SessionsClientInterface } from '../Session/SessionsClientInterface'
import { ContactServiceInterface } from '../Contacts/ContactServiceInterface'
import { FilesClientInterface } from '@standardnotes/files'
import { VaultServiceInterface } from '../Vaults/VaultServiceInterface'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { InternalEventBusInterface } from '../..'
import { ContactPublicKeySetInterface, TrustedContactInterface } from '@standardnotes/models'

describe('SharedVaultService', () => {
  let service: SharedVaultService

  beforeEach(() => {
    const http = {} as jest.Mocked<HttpService>

    const sync = {} as jest.Mocked<SyncServiceInterface>
    sync.addEventObserver = jest.fn()

    const items = {} as jest.Mocked<ItemManagerInterface>
    items.addObserver = jest.fn()

    const mutator = {} as jest.Mocked<MutatorClientInterface>
    const encryption = {} as jest.Mocked<EncryptionProviderInterface>
    const session = {} as jest.Mocked<SessionsClientInterface>
    const contacts = {} as jest.Mocked<ContactServiceInterface>
    const files = {} as jest.Mocked<FilesClientInterface>
    const vaults = {} as jest.Mocked<VaultServiceInterface>
    const storage = {} as jest.Mocked<StorageServiceInterface>
    const eventBus = {} as jest.Mocked<InternalEventBusInterface>

    service = new SharedVaultService(
      http,
      sync,
      items,
      mutator,
      encryption,
      session,
      contacts,
      files,
      vaults,
      storage,
      eventBus,
    )
  })

  describe('shareContactWithUserAdministeredSharedVaults', () => {
    it('should throw if attempting to share self contact', async () => {
      const contact = {
        name: 'Other',
        contactUuid: '456',
        publicKeySet: {} as ContactPublicKeySetInterface,
        isMe: true,
      } as jest.Mocked<TrustedContactInterface>

      await expect(service.shareContactWithUserAdministeredSharedVaults(contact)).rejects.toThrow(
        'Cannot share self contact',
      )
    })
  })
})
