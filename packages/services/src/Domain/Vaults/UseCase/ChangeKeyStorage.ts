import { SyncServiceInterface } from '@standardnotes/services'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import {
  KeySystemRootKeyPasswordType,
  KeySystemRootKeyStorageType,
  VaultListingInterface,
  VaultListingMutator,
} from '@standardnotes/models'
import { KeySystemKeyManagerInterface } from '@standardnotes/encryption'

export class ChangeKeyStorageUseCase {
  constructor(
    private items: ItemManagerInterface,
    private sync: SyncServiceInterface,
    private keys: KeySystemKeyManagerInterface,
  ) {}

  async execute(dto: { vault: VaultListingInterface; preference: KeySystemRootKeyStorageType }): Promise<void> {
    if (dto.vault.rootKeyParams.passwordType !== KeySystemRootKeyPasswordType.UserInputted) {
      throw new Error('Vault uses randomized password and cannot change its storage preference')
    }

    if (dto.preference === dto.vault.rootKeyStorage) {
      throw new Error('Vault already uses this storage preference')
    }

    if (
      dto.preference === KeySystemRootKeyStorageType.Local ||
      dto.preference === KeySystemRootKeyStorageType.Ephemeral
    ) {
      await this.changePreferenceToLocalOrEphemeral(dto.vault, dto.preference)
    } else if (dto.preference === KeySystemRootKeyStorageType.Synced) {
      await this.changePreferenceToSynced(dto.vault)
    }
  }

  private async changePreferenceToLocalOrEphemeral(
    vault: VaultListingInterface,
    preference: KeySystemRootKeyStorageType,
  ): Promise<void> {
    const primaryKey = this.keys.getPrimaryKeySystemRootKey(vault.systemIdentifier)
    if (!primaryKey) {
      throw new Error('No primary key found')
    }

    this.keys.intakeNonPersistentKeySystemRootKey(primaryKey, preference)
    await this.keys.deleteAllSyncedKeySystemRootKeys(vault.systemIdentifier)

    await this.items.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.rootKeyStorage = preference
    })

    await this.sync.sync()
  }

  private async changePreferenceToSynced(vault: VaultListingInterface): Promise<void> {
    const allRootKeys = this.keys.getAllKeySystemRootKeysForVault(vault.systemIdentifier)
    const syncedRootKeys = this.keys.getSyncedKeySystemRootKeysForVault(vault.systemIdentifier)

    for (const key of allRootKeys) {
      const existingSyncedKey = syncedRootKeys.find((syncedKey) => syncedKey.token === key.token)
      if (existingSyncedKey) {
        continue
      }

      await this.items.insertItem(key)
    }

    await this.items.changeItem<VaultListingMutator>(vault, (mutator) => {
      mutator.rootKeyStorage = KeySystemRootKeyStorageType.Synced
    })
  }
}
