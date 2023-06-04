import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { VaultDisplayListing } from '../VaultDisplayListing'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface) {}

  async execute(vault: VaultDisplayListing): Promise<ClientDisplayableError | void> {
    const keySystemItemsKeys = this.items.getKeySystemItemsKeys(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemItemsKeys)

    const keySystemRootKeys = this.items.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemRootKeys)

    const vaultItems = this.items.itemsBelongingToKeySystem(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)
  }
}
