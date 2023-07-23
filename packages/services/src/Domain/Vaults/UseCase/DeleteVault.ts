import { ClientDisplayableError } from '@standardnotes/responses'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { VaultListingInterface } from '@standardnotes/models'
import { KeySystemKeyManagerInterface } from '@standardnotes/encryption'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export class DeleteVault {
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private keys: KeySystemKeyManagerInterface,
  ) {}

  async execute(vault: VaultListingInterface): Promise<ClientDisplayableError | void> {
    if (!vault.systemIdentifier) {
      throw new Error('Vault system identifier is missing')
    }

    await this.keys.deleteNonPersistentSystemRootKeysForVault(vault.systemIdentifier)

    const rootKeys = this.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)
    await this.mutator.setItemsToBeDeleted(rootKeys)

    const itemsKeys = this.keys.getKeySystemItemsKeys(vault.systemIdentifier)
    await this.mutator.setItemsToBeDeleted(itemsKeys)

    const vaultItems = this.items.itemsBelongingToKeySystem(vault.systemIdentifier)
    await this.mutator.setItemsToBeDeleted(vaultItems)

    await this.mutator.setItemToBeDeleted(vault)
  }
}
