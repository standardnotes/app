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

    await this.encryption.keys.deleteNonPersistentSystemRootKeysForVault(vault.systemIdentifier)

    const rootKeys = this.encryption.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(rootKeys)

    const itemsKeys = this.encryption.keys.getKeySystemItemsKeys(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(itemsKeys)

    const vaultItems = this.items.itemsBelongingToKeySystem(vault.systemIdentifier)
    await this.items.setItemsToBeDeleted(vaultItems)

    await this.items.setItemToBeDeleted(vault)
  }
}
