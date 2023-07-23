import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { AnyItemInterface } from '@standardnotes/models'
import { Uuids } from '@standardnotes/utils'

export class RemoveItemsLocally {
  constructor(private readonly items: ItemManagerInterface, private readonly storage: StorageServiceInterface) {}

  async execute(items: AnyItemInterface[]): Promise<void> {
    this.items.removeItemsLocally(items)

    await this.storage.deletePayloadsWithUuids(Uuids(items))
  }
}
