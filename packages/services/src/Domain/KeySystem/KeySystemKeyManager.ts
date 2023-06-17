import {
  EncryptedItemInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
  KeySystemRootKeyInterface,
  Predicate,
} from '@standardnotes/models'
import { ItemManagerInterface } from './../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'
import { KeySystemKeyManagerInterface } from '@standardnotes/encryption'

export class KeySystemKeyManager implements KeySystemKeyManagerInterface {
  constructor(private readonly items: ItemManagerInterface) {}

  getAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[] {
    const keys = this.items.itemsMatchingPredicate<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      new Predicate<KeySystemRootKeyInterface>('systemIdentifier', '=', systemIdentifier),
    )

    return keys
  }

  getKeySystemRootKeyWithToken(
    systemIdentifier: KeySystemIdentifier,
    rootKeyToken: string,
  ): KeySystemRootKeyInterface | undefined {
    const keys = this.getAllKeySystemRootKeysForVault(systemIdentifier).filter((key) => key.token === rootKeyToken)

    if (keys.length > 1) {
      throw new Error('Multiple synced key system root keys found for timestamp')
    }

    return keys[0]
  }

  getPrimaryKeySystemRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined {
    const keys = this.getAllKeySystemRootKeysForVault(systemIdentifier)

    const sortedByNewestFirst = keys.sort((a, b) => b.keyParams.creationTimestamp - a.keyParams.creationTimestamp)
    return sortedByNewestFirst[0]
  }

  public getAllKeySystemItemsKeys(): (KeySystemItemsKeyInterface | EncryptedItemInterface)[] {
    const decryptedItems = this.items.getItems<KeySystemItemsKeyInterface>(ContentType.KeySystemItemsKey)
    const encryptedItems = this.items.invalidItems.filter((item) => item.content_type === ContentType.KeySystemItemsKey)
    return [...decryptedItems, ...encryptedItems]
  }

  public getKeySystemItemsKeys(systemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface[] {
    return this.items
      .getItems<KeySystemItemsKeyInterface>(ContentType.KeySystemItemsKey)
      .filter((key) => key.key_system_identifier === systemIdentifier)
  }

  public getPrimaryKeySystemItemsKey(systemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface {
    const rootKey = this.getPrimaryKeySystemRootKey(systemIdentifier)
    if (!rootKey) {
      throw new Error('No primary key system root key found')
    }

    const matchingItemsKeys = this.getKeySystemItemsKeys(systemIdentifier).filter(
      (key) => key.rootKeyToken === rootKey.token,
    )

    const sortedByNewestFirst = matchingItemsKeys.sort((a, b) => b.creationTimestamp - a.creationTimestamp)
    return sortedByNewestFirst[0]
  }
}
