import { VaultKeyCopyContentSpecialized, VaultKeyCopyInterface, VaultKeyMutator } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class ChangeVaultKeyDataUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(params: {
    vaultSystemIdentifier: string
    newVaultData: VaultKeyCopyContentSpecialized
  }): Promise<VaultKeyCopyInterface> {
    const vaultKey = this.items.getPrimarySyncedVaultKeyCopy(params.vaultUuid)
    if (!vaultKey) {
      throw new Error(`Vault key not found for vault ${params.vaultUuid}`)
    }

    const updatedVaultKey = await this.items.changeItem<VaultKeyMutator, VaultKeyCopyInterface>(vaultKey, (mutator) => {
      mutator.content = params.newVaultData
    })

    return updatedVaultKey
  }
}
