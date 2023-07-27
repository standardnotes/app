import { RemoveItemsFromMemory } from './../Storage/UseCase/RemoveItemsFromMemory'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
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
  KeySystemRootKeyStorageMode,
  Predicate,
  VaultListingInterface,
} from '@standardnotes/models'
import { ItemManagerInterface } from './../Item/ItemManagerInterface'
import { AbstractService } from '../Service/AbstractService'
import { ContentType } from '@standardnotes/domain-core'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { ApplicationEvent } from '../Event/ApplicationEvent'
import { ApplicationStageChangedEventPayload } from '../Event/ApplicationStageChangedEventPayload'
import { KeySystemKeyManagerInterface } from './KeySystemKeyManagerInterface'

const RootKeyStorageKeyPrefix = 'key-system-root-key-'

export class KeySystemKeyManager
  extends AbstractService
  implements KeySystemKeyManagerInterface, InternalEventHandlerInterface
{
  private rootKeyMemoryCache: Record<KeySystemIdentifier, KeySystemRootKeyInterface> = {}

  constructor(
    private readonly items: ItemManagerInterface,
    private readonly mutator: MutatorClientInterface,
    private readonly storage: StorageServiceInterface,
    private readonly _removeItemsFromMemory: RemoveItemsFromMemory,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  public override deinit(): void {
    ;(this.items as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.storage as unknown) = undefined
    ;(this._removeItemsFromMemory as unknown) = undefined
    super.deinit()
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.StorageDecrypted_09) {
        this.loadRootKeysFromStorage()
      }
    }
  }

  private loadRootKeysFromStorage(): void {
    const storageKeys = this.storage.getAllKeys().filter((key) => key.startsWith(RootKeyStorageKeyPrefix))

    const keyRawPayloads = storageKeys.map((key) =>
      this.storage.getValue<DecryptedTransferPayload<KeySystemRootKeyContent>>(key),
    )

    const keyPayloads = keyRawPayloads.map((rawPayload) => new DecryptedPayload<KeySystemRootKeyContent>(rawPayload))

    const keys = keyPayloads.map((payload) => new KeySystemRootKey(payload))

    for (const key of keys) {
      this.rootKeyMemoryCache[key.systemIdentifier] = key
    }
  }

  getRootKeyFromStorageForVault(keySystemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined {
    const payload = this.storage.getValue<DecryptedTransferPayload<KeySystemRootKeyContent>>(
      this.storageKeyForRootKey(keySystemIdentifier),
    )

    if (!payload) {
      return undefined
    }

    const keyPayload = new DecryptedPayload<KeySystemRootKeyContent>(payload)

    const key = new KeySystemRootKey(keyPayload)

    return key
  }

  getMemCachedRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface {
    return this.rootKeyMemoryCache[systemIdentifier]
  }

  private storageKeyForRootKey(systemIdentifier: KeySystemIdentifier): string {
    return `${RootKeyStorageKeyPrefix}${systemIdentifier}`
  }

  /**
   * When the key system root key changes, we must re-encrypt all vault items keys
   * with this new key system root key (by simply re-syncing).
   */
  public async queueVaultItemsKeysForReencryption(keySystemIdentifier: KeySystemIdentifier): Promise<void> {
    const keySystemItemsKeys = this.getKeySystemItemsKeys(keySystemIdentifier)
    if (keySystemItemsKeys.length > 0) {
      await this.mutator.setItemsDirty(keySystemItemsKeys)
    }
  }

  public cacheKey(key: KeySystemRootKeyInterface, storage: KeySystemRootKeyStorageMode): void {
    this.rootKeyMemoryCache[key.systemIdentifier] = key

    if (storage === KeySystemRootKeyStorageMode.Local) {
      this.storage.setValue(this.storageKeyForRootKey(key.systemIdentifier), key.payload.ejected())
    }
  }

  public removeKeyFromCache(systemIdentifier: KeySystemIdentifier): void {
    delete this.rootKeyMemoryCache[systemIdentifier]
    void this.storage.removeValue(this.storageKeyForRootKey(systemIdentifier))
  }

  public getAllSyncedKeySystemRootKeys(): KeySystemRootKeyInterface[] {
    return this.items.getItems(ContentType.TYPES.KeySystemRootKey)
  }

  public async wipeVaultKeysFromMemory(vault: VaultListingInterface): Promise<void> {
    delete this.rootKeyMemoryCache[vault.systemIdentifier]

    const itemsKeys = this.getKeySystemItemsKeys(vault.systemIdentifier)
    await this._removeItemsFromMemory.execute(itemsKeys)
  }

  public getSyncedKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[] {
    return this.items.itemsMatchingPredicate<KeySystemRootKeyInterface>(
      ContentType.TYPES.KeySystemRootKey,
      new Predicate<KeySystemRootKeyInterface>('systemIdentifier', '=', systemIdentifier),
    )
  }

  public getAllKeySystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface[] {
    const synced = this.getSyncedKeySystemRootKeysForVault(systemIdentifier)
    const memory = this.rootKeyMemoryCache[systemIdentifier] ? [this.rootKeyMemoryCache[systemIdentifier]] : []
    return [...synced, ...memory]
  }

  public async deleteNonPersistentSystemRootKeysForVault(systemIdentifier: KeySystemIdentifier): Promise<void> {
    delete this.rootKeyMemoryCache[systemIdentifier]

    await this.storage.removeValue(this.storageKeyForRootKey(systemIdentifier))
  }

  public async deleteAllSyncedKeySystemRootKeys(systemIdentifier: KeySystemIdentifier): Promise<void> {
    const keys = this.getSyncedKeySystemRootKeysForVault(systemIdentifier)
    await this.mutator.setItemsToBeDeleted(keys)
  }

  public getPrimaryKeySystemRootKey(systemIdentifier: KeySystemIdentifier): KeySystemRootKeyInterface | undefined {
    const keys = this.getAllKeySystemRootKeysForVault(systemIdentifier)

    const sortedByNewestFirst = keys.sort((a, b) => b.keyParams.creationTimestamp - a.keyParams.creationTimestamp)
    return sortedByNewestFirst[0]
  }

  public getAllKeySystemItemsKeys(): (KeySystemItemsKeyInterface | EncryptedItemInterface)[] {
    const decryptedItems = this.items.getItems<KeySystemItemsKeyInterface>(ContentType.TYPES.KeySystemItemsKey)
    const encryptedItems = this.items.invalidItems.filter(
      (item) => item.content_type === ContentType.TYPES.KeySystemItemsKey,
    )
    return [...decryptedItems, ...encryptedItems]
  }

  public getKeySystemItemsKeys(systemIdentifier: KeySystemIdentifier): KeySystemItemsKeyInterface[] {
    return this.items
      .getItems<KeySystemItemsKeyInterface>(ContentType.TYPES.KeySystemItemsKey)
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
