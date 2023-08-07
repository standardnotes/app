import { EncryptionProviderInterface } from './../../Encryption/EncryptionProviderInterface'
import { Result, SyncUseCaseInterface } from '@standardnotes/domain-core'
import { KeySystemPasswordType, VaultListingInterface } from '@standardnotes/models'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'

export class ValidateVaultPassword implements SyncUseCaseInterface<boolean> {
  constructor(
    private encryption: EncryptionProviderInterface,
    private keys: KeySystemKeyManagerInterface,
  ) {}

  execute(vault: VaultListingInterface, password: string): Result<boolean> {
    if (vault.keyPasswordType !== KeySystemPasswordType.UserInputted) {
      throw new Error('Vault uses randomized password and cannot be validated with password')
    }

    const rootKey = this.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)

    if (!rootKey) {
      return Result.ok(false)
    }

    const derivedRootKey = this.encryption.deriveUserInputtedKeySystemRootKey({
      keyParams: vault.rootKeyParams,
      userInputtedPassword: password,
    })

    return Result.ok(rootKey.isEqual(derivedRootKey))
  }
}
