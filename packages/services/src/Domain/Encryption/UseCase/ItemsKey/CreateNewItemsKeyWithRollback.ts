import { ItemsKeyMutator, OperatorManager, findDefaultItemsKey } from '@standardnotes/encryption'
import { MutatorClientInterface } from '../../../Mutator/MutatorClientInterface'
import { ItemManagerInterface } from '../../../Item/ItemManagerInterface'
import { RootKeyManager } from '../../RootKey/RootKeyManager'
import { CreateNewDefaultItemsKeyUseCase } from './CreateNewDefaultItemsKey'

export class CreateNewItemsKeyWithRollbackUseCase {
  private createDefaultItemsKeyUseCase = new CreateNewDefaultItemsKeyUseCase(
    this.mutator,
    this.items,
    this.operatorManager,
    this.rootKeyManager,
  )

  constructor(
    private mutator: MutatorClientInterface,
    private items: ItemManagerInterface,
    private operatorManager: OperatorManager,
    private rootKeyManager: RootKeyManager,
  ) {}

  async execute(): Promise<() => Promise<void>> {
    const currentDefaultItemsKey = findDefaultItemsKey(this.items.getDisplayableItemsKeys())
    const newDefaultItemsKey = await this.createDefaultItemsKeyUseCase.execute()

    const rollback = async () => {
      await this.mutator.setItemToBeDeleted(newDefaultItemsKey)

      if (currentDefaultItemsKey) {
        await this.mutator.changeItem<ItemsKeyMutator>(currentDefaultItemsKey, (mutator) => {
          mutator.isDefault = true
        })
      }
    }

    return rollback
  }
}
