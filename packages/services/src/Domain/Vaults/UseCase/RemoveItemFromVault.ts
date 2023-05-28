import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface } from '@standardnotes/models'

export class RemoveItemFromVaultUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { item: DecryptedItemInterface }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.vault_uuid = undefined
    })
  }
}
