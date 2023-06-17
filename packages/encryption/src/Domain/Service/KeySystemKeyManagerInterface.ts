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
  getKeySystemRootKeyWithToken(
    systemIdentifier: KeySystemIdentifier,
    keyIdentifier: string,
  ): KeySystemRootKeyInterface | undefined
  getPrimaryKeySystemRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined

  intakeNonPersistentKeySystemRootKey(key: KeySystemRootKeyInterface, storage: KeySystemRootKeyStorageType): void

  deleteAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): Promise<void>
}
