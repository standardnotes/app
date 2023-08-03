import { RotateVaultKey } from './RotateVaultKey'
import { MutatorClientInterface, SyncServiceInterface } from '@standardnotes/services'
import {
  KeySystemPasswordType,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { ChangeVaultKeyOptionsDTO } from './ChangeVaultKeyOptionsDTO'
import { GetVault } from './GetVault'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class ChangeVaultKeyOptions implements UseCaseInterface<void> {
  constructor(
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private keys: KeySystemKeyManagerInterface,
    private _getVault: GetVault,
    private _rotateVaultKey: RotateVaultKey,
  ) {}

  async execute(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>> {
    if (dto.newPasswordOptions) {
      const result = await this.handleNewPasswordOptions(dto)
      if (result.isFailed()) {
        return result
      }
    }

    if (dto.newStorageMode) {
      const result = await this.handleNewStorageMode(dto)
      if (result.isFailed()) {
        return result
      }
    }

    await this.sync.sync()

    return Result.ok()
  }

  private async handleNewPasswordOptions(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>> {
    if (!dto.newPasswordOptions) {
      return Result.ok()
    }

    if (dto.vault.keyPasswordType === dto.newPasswordOptions.passwordType) {
      return Result.fail('Vault password type is already set to this type')
    }

    if (
      dto.newPasswordOptions.passwordType === KeySystemPasswordType.UserInputted &&
      !dto.newPasswordOptions.userInputtedPassword
    ) {
      return Result.fail('User inputted password is required')
    }

    const result = await this._rotateVaultKey.execute({
      vault: dto.vault,
      userInputtedPassword:
        dto.newPasswordOptions.passwordType === KeySystemPasswordType.UserInputted
          ? dto.newPasswordOptions.userInputtedPassword
          : undefined,
    })

    return result
  }

  private async handleNewStorageMode(dto: ChangeVaultKeyOptionsDTO): Promise<Result<void>> {
    if (!dto.newStorageMode) {
      return Result.ok()
    }

    const result = this._getVault.execute({ keySystemIdentifier: dto.vault.systemIdentifier })
    if (result.isFailed()) {
      return Result.fail('Vault not found')
    }

    const latestVault = result.getValue()

    if (latestVault.rootKeyParams.passwordType !== KeySystemPasswordType.UserInputted) {
      return Result.fail('Vault uses randomized password and cannot change its storage preference')
    }

    if (dto.newStorageMode === latestVault.keyStorageMode) {
      return Result.fail('Vault already uses this storage preference')
    }

    if (
      dto.newStorageMode === KeySystemRootKeyStorageMode.Local ||
      dto.newStorageMode === KeySystemRootKeyStorageMode.Ephemeral
    ) {
      const result = await this.changeStorageModeToLocalOrEphemeral(latestVault, dto.newStorageMode)
      if (result.isFailed()) {
        return result
      }
    } else if (dto.newStorageMode === KeySystemRootKeyStorageMode.Synced) {
      const result = await this.changeStorageModeToSynced(latestVault)
      if (result.isFailed()) {
        return result
      }
    }

    return Result.ok()
  }

  private async changeStorageModeToLocalOrEphemeral(
    vault: VaultListingInterface,
    newStorageMode: KeySystemRootKeyStorageMode,
  ): Promise<Result<void>> {
    const primaryKey = this.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!primaryKey) {
      return Result.fail('No primary key found')
    }

    if (newStorageMode === KeySystemRootKeyStorageMode.Ephemeral) {
      this.keys.removeKeyFromCache(vault.systemIdentifier)
    }

    this.keys.cacheKey(primaryKey, newStorageMode)
    await this.keys.deleteAllSyncedKeySystemRootKeys(vault.systemIdentifier)

    await this.mutator.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.keyStorageMode = newStorageMode
    })

    await this.sync.sync()

    return Result.ok()
  }

  private async changeStorageModeToSynced(vault: VaultListingInterface): Promise<Result<void>> {
    const allRootKeys = this.keys.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
    const syncedRootKeys = this.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)

    this.keys.removeKeyFromCache(vault.systemIdentifier)

    for (const key of allRootKeys) {
      const existingSyncedKey = syncedRootKeys.find((syncedKey) => syncedKey.token === key.token)
      if (existingSyncedKey) {
        continue
      }

      await this.mutator.insertItem(key)
    }

    await this.mutator.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.keyStorageMode = KeySystemRootKeyStorageMode.Synced
    })

    return Result.ok()
  }
}
