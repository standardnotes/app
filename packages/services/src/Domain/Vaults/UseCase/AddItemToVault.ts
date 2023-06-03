import { SyncServiceInterface } from '@standardnotes/services'
import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { DecryptedItemInterface, KeySystemIdentifier } from '@standardnotes/models'

export class AddItemToVaultUseCase {
  constructor(private items: ItemManagerInterface, private sync: SyncServiceInterface) {}

  async execute(dto: {
    item: DecryptedItemInterface
    keySystemIdentifier: KeySystemIdentifier
  }): Promise<ClientDisplayableError | void> {
    await this.items.changeItem(dto.item, (mutator) => {
      mutator.key_system_identifier = dto.keySystemIdentifier
    })

    await this.sync.sync()
  }
}
