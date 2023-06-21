import {
  EncryptedItemInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  KeySystemRootKeyStorageType,
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

  intakeNonPersistentKeySystemRootKey(key: KeySystemRootKeyInterface, storage: KeySystemRootKeyStorageType): void

  deleteAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): Promise<void>
  deleteAllSyncedKeySystemRootKeys(systemIdentifier: KeySystemIdentifier): Promise<void>
}
