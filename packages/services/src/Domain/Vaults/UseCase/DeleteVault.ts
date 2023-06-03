import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { KeySystemIdentifier } from '@standardnotes/models'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { keySystemIdentifier: KeySystemIdentifier }): Promise<ClientDisplayableError | void> {
    const keySystemItemsKeys = this.items.getKeySystemItemsKeys(dto.keySystemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemItemsKeys)

    const keySystemRootKeys = this.items.getAllKeySystemRootKeysForVault(dto.keySystemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemRootKeys)

    const vaultItems = this.items.itemsBelongingToKeySystem(dto.keySystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)
  }
}
