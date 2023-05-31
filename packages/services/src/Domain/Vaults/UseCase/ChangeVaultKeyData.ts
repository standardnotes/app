import { VaultKeyContentSpecialized, VaultKeyInterface, VaultKeyMutator } from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'

export class ChangeVaultKeyDataUseCase {
  constructor(private items: ItemManagerInterface, private encryption: EncryptionProviderInterface) {}

  async execute(params: { vaultUuid: string; newVaultData: VaultKeyContentSpecialized }): Promise<VaultKeyInterface> {
    const vaultKey = this.encryption.getVaultKey(params.vaultUuid)
    if (!vaultKey) {
      throw new Error(`Vault key not found for vault ${params.vaultUuid}`)
    }

    const updatedVaultKey = await this.items.changeItem<VaultKeyMutator, VaultKeyInterface>(vaultKey, (mutator) => {
      mutator.content = params.newVaultData
    })

    return updatedVaultKey
  }
}
