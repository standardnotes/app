import { ContactBelongsToVault } from './../../SharedVaults/UseCase/ContactBelongsToVault'
import { GetOwnedSharedVaults } from './../../SharedVaults/UseCase/GetOwnedSharedVaults'
import { SyncServiceInterface } from './../../Sync/SyncServiceInterface'
import { MutatorClientInterface } from './../../Mutator/MutatorClientInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { TrustedContactInterface } from '@standardnotes/models'

export class DeleteContact implements UseCaseInterface<void> {
  constructor(
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private getOwnedVaults: GetOwnedSharedVaults,
    private contactBelongsToVault: ContactBelongsToVault,
  ) {}

  async execute(dto: { contact: TrustedContactInterface; ownUserUuid: string }): Promise<Result<void>> {
    if (dto.contact.isMe) {
      throw new Error('Cannot delete self')
    }

    const vaults = this.getOwnedVaults.execute()
    if (vaults.isFailed()) {
      return Result.fail('Failed to get owned vaults')
    }

    for (const vault of vaults.getValue()) {
      const contactBelongsToVault = await this.contactBelongsToVault.execute({
        contact: dto.contact,
        vault: vault,
      })
      if (contactBelongsToVault.isFailed()) {
        return Result.fail('Failed to check contact membership')
      }

      if (contactBelongsToVault.getValue()) {
        return Result.fail('Cannot delete contact that belongs to an owned vault')
      }
    }

    await this.mutator.setItemToBeDeleted(dto.contact)
    await this.sync.sync()

    return Result.ok()
  }
}
