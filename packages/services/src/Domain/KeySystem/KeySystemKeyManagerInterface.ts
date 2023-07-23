import {
  EncryptedItemInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  KeySystemRootKeyStorageMode,
  VaultListingInterface,
} from '@standardnotes/models'

export interface KeySystemKeyManagerInterface {
  getAllKeySystemItemsKeys(): (KeySystemItemsKeyInterface | EncryptedItemInterface)[]
  getKeySystemItemsKeys(systemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface[]
  getPrimaryKeySystemItemsKey(systemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface

  /** Returns synced root keys, in addition to any local or ephemeral keys */
  getAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[]
  getSyncedKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[]
  getAllSyncedKeySystemRootKeys(): KeySystemRootKeyInterface[]
  getKeySystemRootKeyWithToken(
    systemIdentifier: KeySystemIdentifier,
    keyIdentifier: string,
  ): KeySystemRootKeyInterface | undefined
  getPrimaryKeySystemRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined
  reencryptKeySystemItemsKeysForVault(keySystemIdentifier: KeySystemIdentifier): Promise<void>

  intakeNonPersistentKeySystemRootKey(key: KeySystemRootKeyInterface, storage: KeySystemRootKeyStorageMode): void
  undoIntakeNonPersistentKeySystemRootKey(systemIdentifier: KeySystemIdentifier): void

  clearMemoryOfKeysRelatedToVault(vault: VaultListingInterface): void
  deleteNonPersistentSystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): Promise<void>
  deleteAllSyncedKeySystemRootKeys(systemIdentifier: KeySystemIdentifier): Promise<void>
}
