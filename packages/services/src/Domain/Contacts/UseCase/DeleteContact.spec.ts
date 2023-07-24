import { ContactBelongsToVault } from './../../SharedVaults/UseCase/ContactBelongsToVault'
import { GetOwnedSharedVaults } from './../../SharedVaults/UseCase/GetOwnedSharedVaults'
import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { Result } from '@standardnotes/domain-core'
import { TrustedContactInterface } from '@standardnotes/models'
import { DeleteContact } from './DeleteContact'

describe('DeleteContact', () => {
  let mutator: jest.Mocked<MutatorClientInterface>
  let sync: jest.Mocked<SyncServiceInterface>
  let getOwnedVaults: jest.Mocked<GetOwnedSharedVaults>
  let contactBelongsToVault: jest.Mocked<ContactBelongsToVault>
  let deleteContact: DeleteContact
  let mockDto: {
    contact: TrustedContactInterface
    ownUserUuid: string
  }
  let mockVaults: { id: string }[]

  beforeEach(() => {
    mutator = {} as jest.Mocked<MutatorClientInterface>
    sync = {} as jest.Mocked<SyncServiceInterface>

    getOwnedVaults = {} as jest.Mocked<GetOwnedSharedVaults>
    getOwnedVaults.execute = jest.fn()

    contactBelongsToVault = {} as jest.Mocked<ContactBelongsToVault>
    contactBelongsToVault.execute = jest.fn()

    deleteContact = new DeleteContact(mutator, sync, getOwnedVaults, contactBelongsToVault)

    mockDto = {
      contact: { isMe: false } as TrustedContactInterface,
      ownUserUuid: 'test-user-uuid',
    }

    mockVaults = [{ id: 'vault1' }, { id: 'vault2' }]
  })

  describe('execute', () => {
    it('should throw error when deleting self', async () => {
      mockDto.contact.isMe = true
      await expect(deleteContact.execute(mockDto)).rejects.toThrow('Cannot delete self')
    })

    it('should return failure when getting owned vaults fails', async () => {
      getOwnedVaults.execute = jest.fn().mockReturnValue(Result.fail('Failed to get owned vaults'))

      const result = await deleteContact.execute(mockDto)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Failed to get owned vaults')
    })

    it('should return failure when checking contact membership fails', async () => {
      getOwnedVaults.execute = jest.fn().mockReturnValue(Result.ok(mockVaults))
      contactBelongsToVault.execute = jest.fn().mockResolvedValue(Result.fail('Failed to check contact membership'))

      const result = await deleteContact.execute(mockDto)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Failed to check contact membership')
    })

    it('should return failure when contact belongs to an owned vault', async () => {
      getOwnedVaults.execute = jest.fn().mockReturnValue(Result.ok(mockVaults))
      contactBelongsToVault.execute = jest.fn().mockResolvedValue(Result.ok(true))

      const result = await deleteContact.execute(mockDto)

      expect(result.isFailed()).toBe(true)
      expect(result.getError()).toBe('Cannot delete contact that belongs to an owned vault')
    })

    it('should return success when contact is successfully deleted', async () => {
      getOwnedVaults.execute = jest.fn().mockReturnValue(Result.ok(mockVaults))
      contactBelongsToVault.execute = jest.fn().mockResolvedValue(Result.ok(false))
      mutator.setItemToBeDeleted = jest.fn().mockResolvedValue(undefined)
      sync.sync = jest.fn().mockResolvedValue(undefined)

      const result = await deleteContact.execute(mockDto)

      expect(result.isFailed()).toBe(false)
    })
  })
})
