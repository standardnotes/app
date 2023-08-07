import { ClientDisplayableError } from '@standardnotes/responses'
import { VaultListingInterface } from '@standardnotes/models'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'
import { GetVaultItems } from './GetVaultItems'

export class DeleteVault {
  constructor(
    private mutator: MutatorClientInterface,
    private keys: KeySystemKeyManagerInterface,
    private _getVaultItems: GetVaultItems,
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

    const vaultItems = this._getVaultItems.execute(vault).getValue()
    await this.mutator.setItemsToBeDeleted(vaultItems)

    await this.mutator.setItemToBeDeleted(vault)
  }
}
