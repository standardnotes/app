import { ItemsKeyMutator } from '@standardnotes/encryption'
import { MutatorClientInterface } from '../../../Mutator/MutatorClientInterface'
import { ItemManagerInterface } from '../../../Item/ItemManagerInterface'
import { CreateNewDefaultItemsKey } from './CreateNewDefaultItemsKey'
import { DiscardItemsLocally } from '../../../UseCase/DiscardItemsLocally'
import { FindDefaultItemsKey } from './FindDefaultItemsKey'

export class CreateNewItemsKeyWithRollback {
  constructor(
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private _createDefaultItemsKey: CreateNewDefaultItemsKey,
    private _discardItemsLocally: DiscardItemsLocally,
    private _findDefaultItemsKey: FindDefaultItemsKey,
  ) {}

  async execute(): Promise<() => Promise<void>> {
    const currentDefaultItemsKey = this._findDefaultItemsKey.execute(this.items.getDisplayableItemsKeys()).getValue()
    const newDefaultItemsKey = await this._createDefaultItemsKey.execute()

    const rollback = async () => {
      await this._discardItemsLocally.execute([newDefaultItemsKey])

      if (currentDefaultItemsKey) {
        await this.mutator.changeItem<ItemsKeyMutator>(currentDefaultItemsKey, (mutator) => {
          mutator.isDefault = true
        })
      }
    }

    return rollback
  }
}
