import { ApplicationStage } from './../Application/ApplicationStage'
import { InternalEventBusInterface } from './../Internal/InternalEventBusInterface'
import { StorageServiceInterface } from './../Storage/StorageServiceInterface'
import {
  DecryptedPayload,
  DecryptedTransferPayload,
  EncryptedItemInterface,
  KeySystemIdentifier,
  KeySystemItemsKeyInterface,
  KeySystemRootKey,
  KeySystemRootKeyContent,
  KeySystemRootKeyInterface,
  KeySystemRootKeyStorageType,
  Predicate,
} from '@standardnotes/models'
import { ItemManagerInterface } from './../Item/ItemManagerInterface'
import { ContentType } from '@standardnotes/common'
import { KeySystemKeyManagerInterface } from '@standardnotes/encryption'
import { AbstractService } from '../Service/AbstractService'

const RootKeyStorageKeyPrefix = 'key-system-root-key-'

export class KeySystemKeyManager extends AbstractService implements KeySystemKeyManagerInterface {
  private rootKeyMemoryCache: Record<KeySystemIdentifier, KeySystemRootKeyInterface> = {}

  constructor(
    private readonly items: ItemManagerInterface,
    private readonly storage: StorageServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  public override async handleApplicationStage(stage: ApplicationStage): Promise<void> {
    if (stage === ApplicationStage.StorageDecrypted_09) {
      this.loadRootKeysFromStorage()
    }
  }

  private loadRootKeysFromStorage(): void {
    const storageKeys = this.storage.getAllKeys().filter((key) => key.startsWith(RootKeyStorageKeyPrefix))

    const keyRawPayloads = storageKeys.map((key) =>
      this.storage.getValue<DecryptedTransferPayload<KeySystemRootKeyContent>>(key),
    )

    const keyPayloads = keyRawPayloads.map((rawPayload) => new DecryptedPayload<KeySystemRootKeyContent>(rawPayload))

    const keys = keyPayloads.map((payload) => new KeySystemRootKey(payload))
    keys.forEach((key) => {
      this.rootKeyMemoryCache[key.systemIdentifier] = key
    })
  }

  private storageKeyForRootKey(systemIdentifier: KeySystemIdentifier): string {
    return `${RootKeyStorageKeyPrefix}${systemIdentifier}`
  }

  public intakeNonPersistentKeySystemRootKey(
    key: KeySystemRootKeyInterface,
    storage: KeySystemRootKeyStorageType,
  ): void {
    this.rootKeyMemoryCache[key.systemIdentifier] = key

    if (storage === KeySystemRootKeyStorageType.Local) {
      this.storage.setValue(this.storageKeyForRootKey(key.systemIdentifier), key.payload.ejected())
    }
  }

  public getAllSyncedKeySystemRootKeys(): KeySystemRootKeyInterface[] {
    return this.items.getItems(ContentType.KeySystemRootKey)
  }

  private getSyncedKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[] {
    return this.items.itemsMatchingPredicate<KeySystemRootKeyInterface>(
      ContentType.KeySystemRootKey,
      new Predicate<KeySystemRootKeyInterface>('systemIdentifier', '=', systemIdentifier),
    )
  }

  private getAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[] {
    const synced = this.getSyncedKeySystemRootKeysForVault(systemIdentifier)
    const memory = this.rootKeyMemoryCache[systemIdentifier] ? [this.rootKeyMemoryCache[systemIdentifier]] : []
    return [...synced, ...memory]
  }

  public async deleteAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): Promise<void> {
    const syncedKeys = this.getSyncedKeySystemRootKeysForVault(systemIdentifier)
    await this.items.setItemsToBeDeleted(syncedKeys)

    delete this.rootKeyMemoryCache[systemIdentifier]

    await this.storage.removeValue(this.storageKeyForRootKey(systemIdentifier))
  }

  public getKeySystemRootKeyWithToken(
    systemIdentifier: KeySystemIdentifier,
    rootKeyToken: string,
  ): KeySystemRootKeyInterface | undefined {
    const keys = this.getAllKeySystemRootKeysForVault(systemIdentifier).filter((key) => key.token === rootKeyToken)

    if (keys.length > 1) {
      throw new Error('Multiple synced key system root keys found for token')
    }

    return keys[0]
  }

  public getPrimaryKeySystemRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined {
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
