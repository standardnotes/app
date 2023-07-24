import { ContentType, Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { VaultListingInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class GetVaults implements SyncUseCaseInterface<VaultListingInterface[]> {
  constructor(private items: ItemManagerInterface) {}

  execute(): Result<VaultListingInterface[]> {
    const vaults = this.items.getItems<VaultListingInterface>(ContentType.TYPES.VaultListing).sort((a, b) => {
      return a.name.localeCompare(b.name)
    })

    return Result.ok(vaults)
  }
}
