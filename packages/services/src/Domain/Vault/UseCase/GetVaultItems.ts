import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { DecryptedItemInterface, ItemContent, VaultListingInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class GetVaultItems implements SyncUseCaseInterface<DecryptedItemInterface[]> {
  constructor(private items: ItemManagerInterface) {}

  execute(vault: VaultListingInterface): Result<DecryptedItemInterface<ItemContent>[]> {
    return Result.ok(this.items.items.filter((item) => item.key_system_identifier === vault.systemIdentifier))
  }
}
