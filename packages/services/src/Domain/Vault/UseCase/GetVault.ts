import { VaultListingInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { ContentType, Result, SyncUseCaseInterface } from '@standardnotes/domain-core'

export class GetVault implements SyncUseCaseInterface<VaultListingInterface> {
  constructor(private items: ItemManagerInterface) {}

  execute<T extends VaultListingInterface>(
    query: { keySystemIdentifier: string } | { sharedVaultUuid: string },
  ): Result<T> {
    const vaults = this.items.getItems<VaultListingInterface>(ContentType.TYPES.VaultListing)

    if ('keySystemIdentifier' in query) {
      const result = vaults.find((listing) => listing.systemIdentifier === query.keySystemIdentifier) as T
      if (!result) {
        return Result.fail('Vault not found')
      }

      return Result.ok(result)
    } else {
      const result = vaults.find((listing) => listing.sharing?.sharedVaultUuid === query.sharedVaultUuid) as T
      if (!result) {
        return Result.fail('Shared vault not found')
      }

      return Result.ok(result)
    }
  }
}
