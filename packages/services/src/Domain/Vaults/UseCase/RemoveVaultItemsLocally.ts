import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AnyItemInterface } from '@standardnotes/models'

export class RemoveVaultItemsLocallyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { vaultUuids: string[] }): Promise<void> {
    const items = this.items.allTrackedItems()
    const itemsToRemove = items.filter((item) => item.vault_uuid && dto.vaultUuids.includes(item.vault_uuid))
    this.items.removeItemsLocally(itemsToRemove as AnyItemInterface[])
  }
}
