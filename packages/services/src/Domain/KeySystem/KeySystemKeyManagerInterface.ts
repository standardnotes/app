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
  getPrimaryKeySystemRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined
  queueVaultItemsKeysForReencryption(keySystemIdentifier: KeySystemIdentifier): Promise<void>

  cacheKey(key: KeySystemRootKeyInterface, storage: KeySystemRootKeyStorageMode): void
  removeKeyFromCache(systemIdentifier: KeySystemIdentifier): void

  wipeVaultKeysFromMemory(vault: VaultListingInterface): Promise<void>
  deleteNonPersistentSystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): Promise<void>
  deleteAllSyncedKeySystemRootKeys(systemIdentifier: KeySystemIdentifier): Promise<void>
}
