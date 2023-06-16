import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { VaultListingInterface } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class DeleteVaultUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(vault: VaultListingInterface): Promise<ClientDisplayableError | void> {
    if (!vault.systemIdentifier) {
      throw new Error('Vault system identifier is missing')
    }
    const keySystemRootKeys = this.encryption.keySystemKeyManager.getAllKeySystemRootKeysForVault(
      vault.systemIdentifier,
    )
    await this.items.setItemsToBeDeleted(keySystemRootKeys)

    const keySystemItemsKeys = this.encryption.keySystemKeyManager.getKeySystemItemsKeys(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(keySystemItemsKeys)

    const vaultItems = this.items.itemsBelongingToKeySystem(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)
  }
}
