import { SyncServiceInterface } from '@standardnotes/services'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import {
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageType,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { EncryptionProviderInterface } from '@standardnotes/encryption'

export class ChangeKeyPasswordTypeUseCase {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private encryption: EncryptionProviderInterface,
  ) {}

  async execute(dto: {
    vault: VaultListingInterface
    newType: KeySystemRootKeyPasswordType
    userInputtedPassword: string | undefined
  }): Promise<void> {
    if (dto.vault.rootKeyPasswordType === dto.newType) {
      throw new Error('Vault password type is already set to this type')
    }

    if (dto.newType === KeySystemRootKeyPasswordType.UserInputted) {
      if (!dto.userInputtedPassword) {
        throw new Error('User inputted password is required')
      }
      await this.changeToUserInputtedPassword(dto.vault, dto.userInputtedPassword)
    } else if (dto.newType === KeySystemRootKeyPasswordType.Randomized) {
      if (dto.userInputtedPassword) {
        throw new Error('User inputted password must be undefined')
      }
      await this.changeToRandomizedPassword(dto.vault)
    }

    await this.sync.sync()
  }

  private async changeToUserInputtedPassword(
    vault: VaultListingInterface,
    userInputtedPassword: string,
  ): Promise<void> {
    const newRootKey = this.encryption.createUserInputtedKeySystemRootKey({
      systemIdentifier: vault.systemIdentifier,
      userInputtedPassword: userInputtedPassword,
    })

    if (vault.rootKeyStorage === KeySystemRootKeyStorageType.Synced) {
      await this.items.insertItem(newRootKey, true)
    } else {
      this.encryption.keys.intakeNonPersistentKeySystemRootKey(newRootKey, vault.rootKeyStorage)
    }

    await this.items.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.rootKeyParams = newRootKey.keyParams
    })

    await this.encryption.reencryptKeySystemItemsKeysForVault(vault.systemIdentifier)
  }

  private async changeToRandomizedPassword(vault: VaultListingInterface): Promise<void> {
    const newRootKey = this.encryption.createRandomizedKeySystemRootKey({
      systemIdentifier: vault.systemIdentifier,
    })

    if (vault.rootKeyStorage !== KeySystemRootKeyStorageType.Synced) {
      throw new Error('Cannot change to randomized password if root key storage is not synced')
    }

    await this.items.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.rootKeyParams = newRootKey.keyParams
    })

    await this.items.insertItem(newRootKey, true)

    await this.encryption.reencryptKeySystemItemsKeysForVault(vault.systemIdentifier)
  }
}
