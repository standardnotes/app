import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { VaultDisplayListing } from '@standardnotes/models'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(vault: VaultDisplayListing): Promise<ClientDisplayableError | void> {
    if (!vault.systemIdentifier) {
      throw new Error('Vault system identifier is missing')
    }
    const keySystemRootKeys = this.items.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemRootKeys)

    const keySystemItemsKeys = this.items.getKeySystemItemsKeys(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemItemsKeys)

    const vaultItems = this.items.itemsBelongingToKeySystem(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)
  }
}
