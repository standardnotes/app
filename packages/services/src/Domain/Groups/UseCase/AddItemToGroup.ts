import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface } from '@standardnotes/models'

export class AddItemToGroupUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { item: DecryptedItemInterface; groupUuid: string }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.group_uuid = dto.groupUuid
    })
  }
}
