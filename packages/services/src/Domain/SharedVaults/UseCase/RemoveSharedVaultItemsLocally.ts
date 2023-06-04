import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AnyItemInterface } from '@standardnotes/models'

export class RemoveSharedVaultItemsLocallyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { sharedVaultUuids: string[] }): Promise<void> {
    const items = this.items.allTrackedItems()
    const itemsToRemove = items.filter(
      (item) => item.shared_vault_uuid && dto.sharedVaultUuids.includes(item.shared_vault_uuid),
    )
    this.items.removeItemsLocally(itemsToRemove as AnyItemInterface[])
  }
}
