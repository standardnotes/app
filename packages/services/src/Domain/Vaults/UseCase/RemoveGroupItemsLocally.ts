import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AnyItemInterface } from '@standardnotes/models'

export class RemoveGroupItemsLocallyUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { groupUuids: string[] }): Promise<void> {
    const items = this.items.allTrackedItems()
    const itemsToRemove = items.filter((item) => item.group_uuid && dto.groupUuids.includes(item.group_uuid))
    this.items.removeItemsLocally(itemsToRemove as AnyItemInterface[])
  }
}
