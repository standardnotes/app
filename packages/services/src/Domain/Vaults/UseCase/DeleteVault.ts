import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { KeySystemIdentifier } from '@standardnotes/models'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { keySystemIdentifier: KeySystemIdentifier }): Promise<ClientDisplayableError | void> {
    const vaultItemsKeys = this.items.getAllVaultItemsKeysForVault(dto.keySystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItemsKeys)

    const vaultKeyCopies = this.items.getAllSyncedVaultKeyCopiesForVault(dto.keySystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultKeyCopies)

    const vaultItems = this.items.itemsBelongingToKeySystem(dto.keySystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)
  }
}
