import { VaultListingInterface } from '@standardnotes/models'
import { ItemManagerInterface } from './../../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/domain-core'

export class GetVaultUseCase<T extends VaultListingInterface> {
  constructor(private items: ItemManagerInterface) {}

  execute(query: { keySystemIdentifier: string } | { sharedVaultUuid: string }): T | undefined {
    const vaults = this.items.getItems<VaultListingInterface>(ContentType.TYPES.VaultListing)

    if ('keySystemIdentifier' in query) {
      return vaults.find((listing) => listing.systemIdentifier === query.keySystemIdentifier) as T
    } else {
      return vaults.find((listing) => listing.sharing?.sharedVaultUuid === query.sharedVaultUuid) as T
    }
  }
}
