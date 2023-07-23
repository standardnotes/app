import { ItemsKeyMutator } from '@standardnotes/encryption'
import { MutatorClientInterface } from '../../../Mutator/MutatorClientInterface'
import { ItemManagerInterface } from '../../../Item/ItemManagerInterface'
import { CreateNewDefaultItemsKey } from './CreateNewDefaultItemsKey'
import { RemoveItemsLocally } from '../../../UseCase/RemoveItemsLocally'
import { FindDefaultItemsKey } from './FindDefaultItemsKey'

export class CreateNewItemsKeyWithRollback {
  constructor(
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private createDefaultItemsKey: CreateNewDefaultItemsKey,
    private removeItemsLocally: RemoveItemsLocally,
    private findDefaultItemsKey: FindDefaultItemsKey,
  ) {}

  async execute(): Promise<() => Promise<void>> {
    const currentDefaultItemsKey = this.findDefaultItemsKey.execute(this.items.getDisplayableItemsKeys()).getValue()
    const newDefaultItemsKey = await this.createDefaultItemsKey.execute()

    const rollback = async () => {
      await this.removeItemsLocally.execute([newDefaultItemsKey])

      if (currentDefaultItemsKey) {
        await this.mutator.changeItem<ItemsKeyMutator>(currentDefaultItemsKey, (mutator) => {
          mutator.isDefault = true
        })
      }
    }

    return rollback
  }
}
