import { MutatorClientInterface, SharedVaultServerInterface, VaultListingInterface } from '@standardnotes/snjs'
import { SyncLocalVaultsWithRemoteSharedVaults } from './SyncLocalVaultsWithRemoteSharedVaults'

describe('SyncLocalVaultsWithRemoteSharedVaults', () => {
  let sharedVaultServer: SharedVaultServerInterface
  let mutator: MutatorClientInterface

  const createUseCase = () => new SyncLocalVaultsWithRemoteSharedVaults(sharedVaultServer, mutator)

  beforeEach(() => {
    sharedVaultServer = {} as jest.Mocked<SharedVaultServerInterface>
    sharedVaultServer.getSharedVaults = jest.fn().mockResolvedValue({ data: { sharedVaults: [{
      uuid: '1-2-3',
      user_uuid: '2-3-4',
      file_upload_bytes_used: 123,
      created_at_timestamp: 123,
      updated_at_timestamp: 123,
    }] } })

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.changeItem = jest.fn()
  })

  it('should sync local vaults with remote shared vaults to update file storage usage', async () => {
    const localVaults = [{
      uuid: '1-2-3',
      name: 'Vault',
      isSharedVaultListing: () => true,
      sharing: {
        sharedVaultUuid: '1-2-3',
        ownerUserUuid: '2-3-4',
        fileBytesUsed: 0,
      },
    } as jest.Mocked<VaultListingInterface>]

    const useCase = createUseCase()
    await useCase.execute(localVaults)

    expect(mutator.changeItem).toHaveBeenCalledWith(localVaults[0], expect.any(Function))
  })

  it('should fail if shared vault server returns error', async () => {
    sharedVaultServer.getSharedVaults = jest.fn().mockResolvedValue({ data: { error: { message: 'test-error' } } })

    const localVaults = [{
      uuid: '1-2-3',
      name: 'Vault',
      isSharedVaultListing: () => true,
      sharing: {
        sharedVaultUuid: '1-2-3',
        ownerUserUuid: '2-3-4',
        fileBytesUsed: 0,
      },
    } as jest.Mocked<VaultListingInterface>]

    const useCase = createUseCase()
    const result = await useCase.execute(localVaults)

    expect(result.isFailed()).toBe(true)
  })

  it('should not sync local vaults with remote shared vaults if local vault is not shared', async () => {
    const localVaults = [{
      uuid: '1-2-3',
      name: 'Vault',
      isSharedVaultListing: () => false,
      sharing: {
        sharedVaultUuid: '1-2-3',
        ownerUserUuid: '2-3-4',
        fileBytesUsed: 0,
      },
    } as jest.Mocked<VaultListingInterface>]

    const useCase = createUseCase()
    await useCase.execute(localVaults)

    expect(mutator.changeItem).not.toHaveBeenCalled()
  })
})
