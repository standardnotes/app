import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(dto: { vaultSystemIdentifier: string }): Promise<ClientDisplayableError | void> {
    const vaultItemsKeys = this.items.getAllVaultItemsKeysForVault(dto.vaultSystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItemsKeys)

    const vaultKeyCopies = this.items.getAllSyncedVaultKeyCopiesForVault(dto.vaultSystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultKeyCopies)

    const vaultItems = this.items.itemsBelongingToVaultSystem(dto.vaultSystemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)
  }
}
