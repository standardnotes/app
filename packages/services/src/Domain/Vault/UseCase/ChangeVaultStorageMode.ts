import { MutatorClientInterface, SyncServiceInterface } from '@standardnotes/services'
import {
  KeySystemPasswordType,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { GetVault } from './GetVault'
import { KeySystemKeyManagerInterface } from '../../KeySystem/KeySystemKeyManagerInterface'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'

export class ChangeVaultStorageMode implements UseCaseInterface<VaultListingInterface> {
  constructor(
    private mutator: MutatorClientInterface,
    private sync: SyncServiceInterface,
    private keys: KeySystemKeyManagerInterface,
    private _getVault: GetVault,
  ) {}

  async execute(dto: {
    vault: VaultListingInterface
    newStorageMode: KeySystemRootKeyStorageMode
  }): Promise<Result<VaultListingInterface>> {
    const result = this._getVault.execute({ keySystemIdentifier: dto.vault.systemIdentifier })
    if (result.isFailed()) {
      return Result.fail('Vault not found')
    }

    const vault = result.getValue()
    if (
      vault.keyPasswordType === KeySystemPasswordType.Randomized &&
      dto.newStorageMode !== KeySystemRootKeyStorageMode.Synced
    ) {
      return Result.fail('Cannot change storage mode to non-synced for randomized vault')
    }

    const latestVault = result.getValue()

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
  ): Promise<Result<VaultListingInterface>> {
    const primaryKey = this.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!primaryKey) {
      return Result.fail('No primary key found')
    }

    if (newStorageMode === KeySystemRootKeyStorageMode.Ephemeral) {
      this.keys.removeKeyFromCache(vault.systemIdentifier)
    }

    this.keys.cacheKey(primaryKey, newStorageMode)
    await this.keys.deleteAllSyncedKeySystemRootKeys(vault.systemIdentifier)

    const updatedVault = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(vault, (mutator) => {
      mutator.keyStorageMode = newStorageMode
    })

    await this.sync.sync()

    return Result.ok(updatedVault)
  }

  private async changeStorageModeToSynced(vault: VaultListingInterface): Promise<Result<VaultListingInterface>> {
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

    const updatedVault = await this.mutator.changeItem<VaultListingMutator, VaultListingInterface>(vault, (mutator) => {
      mutator.keyStorageMode = KeySystemRootKeyStorageMode.Synced
    })

    return Result.ok(updatedVault)
  }
}
