import { Copy, extendArray, UuidGenerator, Uuids } from '@standardnotes/utils'
import { SNLog } from '../../Log'
import {
  KeyedDecryptionSplit,
  KeyedEncryptionSplit,
  SplitPayloadsByEncryptionType,
  CreateEncryptionSplitWithKeyLookup,
  isErrorDecryptingParameters,
  SNRootKey,
} from '@standardnotes/encryption'
import {
  AbstractService,
  StorageServiceInterface,
  InternalEventHandlerInterface,
  StoragePersistencePolicies,
  StorageValuesObject,
  DeviceInterface,
  InternalEventBusInterface,
  InternalEventInterface,
  ApplicationEvent,
  ApplicationStageChangedEventPayload,
  ApplicationStage,
  ValueModesKeys,
  StorageValueModes,
  namespacedKey,
  RawStorageKey,
  WrappedStorageValue,
  ValuesObjectRecord,
  EncryptionProviderInterface,
} from '@standardnotes/services'
import {
  CreateDecryptedLocalStorageContextPayload,
  CreateDeletedLocalStorageContextPayload,
  CreateEncryptedLocalStorageContextPayload,
  CreatePayloadSplitWithDiscardables,
  DecryptedPayload,
  EncryptedPayload,
  FullyFormedPayloadInterface,
  isEncryptedLocalStoragePayload,
  ItemContent,
  DecryptedPayloadInterface,
  DeletedPayloadInterface,
  PayloadTimestampDefaults,
  LocalStorageEncryptedContextualPayload,
  FullyFormedTransferPayload,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'

/**
 * The storage service is responsible for persistence of both simple key-values, and payload
 * storage. It does so by relying on deviceInterface to save and retrieve raw values and payloads.
 * For simple key/values, items are grouped together in an in-memory hash, and persisted to disk
 * as a single object (encrypted, when possible). It handles persisting payloads in the local
 * database by encrypting the payloads when possible.
 * The storage service also exposes methods that allow the application to initially
 * decrypt the persisted key/values, and also a method to determine whether a particular
 * key can decrypt wrapped storage.
 */
export class DiskStorageService
  extends AbstractService
  implements StorageServiceInterface, InternalEventHandlerInterface
{
  private encryptionProvider!: EncryptionProviderInterface
  private storagePersistable = false
  private persistencePolicy!: StoragePersistencePolicies
  private needsPersist = false
  private currentPersistPromise?: Promise<StorageValuesObject>

  private values!: StorageValuesObject

  constructor(
    private device: DeviceInterface,
    private identifier: string,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    void this.setPersistencePolicy(StoragePersistencePolicies.Default)
  }

  public provideEncryptionProvider(provider: EncryptionProviderInterface): void {
    this.encryptionProvider = provider
  }

  public override deinit() {
    ;(this.device as unknown) = undefined
    ;(this.encryptionProvider as unknown) = undefined
    this.storagePersistable = false
    super.deinit()
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.Launched_10) {
        this.storagePersistable = true
        if (this.needsPersist) {
          void this.persistValuesToDisk()
        }
      }
    }
  }

  public async setPersistencePolicy(persistencePolicy: StoragePersistencePolicies) {
    this.persistencePolicy = persistencePolicy

    if (this.persistencePolicy === StoragePersistencePolicies.Ephemeral) {
      await this.device.clearNamespacedKeychainValue(this.identifier)
      await this.device.removeAllDatabaseEntries(this.identifier)
      await this.device.removeRawStorageValuesForIdentifier(this.identifier)
      await this.clearAllPayloads()
    }
  }

  public isEphemeralSession(): boolean {
    return this.persistencePolicy === StoragePersistencePolicies.Ephemeral
  }

  public async initializeFromDisk(): Promise<void> {
    const value = await this.device.getRawStorageValue(this.getPersistenceKey())
    const values = value ? JSON.parse(value as string) : undefined

    await this.setInitialValues(values)
  }

  private async setInitialValues(values?: StorageValuesObject) {
    const sureValues = values || this.defaultValuesObject()

    if (!sureValues[ValueModesKeys.Unwrapped]) {
      sureValues[ValueModesKeys.Unwrapped] = {}
    }

    this.values = sureValues

    if (!this.isStorageWrapped()) {
      this.values[ValueModesKeys.Unwrapped] = {
        ...(this.values[ValueModesKeys.Wrapped].content as object),
        ...this.values[ValueModesKeys.Unwrapped],
      }
    }
  }

  public isStorageWrapped(): boolean {
    const wrappedValue = this.values[ValueModesKeys.Wrapped]

    return wrappedValue != undefined && isEncryptedLocalStoragePayload(wrappedValue)
  }

  public async canDecryptWithKey(key: SNRootKey): Promise<boolean> {
    const wrappedValue = this.values[ValueModesKeys.Wrapped]

    if (!isEncryptedLocalStoragePayload(wrappedValue)) {
      throw Error('Attempting to decrypt non decrypted storage value')
    }

    const decryptedPayload = await this.decryptWrappedValue(wrappedValue, key)
    return !isErrorDecryptingParameters(decryptedPayload)
  }

  private async decryptWrappedValue(wrappedValue: LocalStorageEncryptedContextualPayload, key?: SNRootKey) {
    /**
     * The read content type doesn't matter, so long as we know it responds
     * to content type. This allows a more seamless transition when both web
     * and mobile used different content types for encrypted storage.
     */
    if (!wrappedValue?.content_type) {
      throw Error('Attempting to decrypt nonexistent wrapped value')
    }

    const payload = new EncryptedPayload({
      ...wrappedValue,
      ...PayloadTimestampDefaults(),
      content_type: ContentType.TYPES.EncryptedStorage,
    })

    const split: KeyedDecryptionSplit = key
      ? {
          usesRootKey: {
            items: [payload],
            key: key,
          },
        }
      : {
          usesRootKeyWithKeyLookup: {
            items: [payload],
          },
        }

    const decryptedPayload = await this.encryptionProvider.decryptSplitSingle(split)

    return decryptedPayload
  }

  public async decryptStorage(): Promise<void> {
    const wrappedValue = this.values[ValueModesKeys.Wrapped]

    if (!isEncryptedLocalStoragePayload(wrappedValue)) {
      throw Error('Attempting to decrypt already decrypted storage')
    }

    const decryptedPayload = await this.decryptWrappedValue(wrappedValue)

    if (isErrorDecryptingParameters(decryptedPayload)) {
      throw SNLog.error(Error('Unable to decrypt storage.'))
    }

    this.values[ValueModesKeys.Unwrapped] = Copy(decryptedPayload.content)
  }

  /** @todo This function should be debounced. */
  private async persistValuesToDisk() {
    if (!this.storagePersistable) {
      this.needsPersist = true
      return
    }

    if (this.persistencePolicy === StoragePersistencePolicies.Ephemeral) {
      return
    }

    await this.currentPersistPromise

    this.needsPersist = false

    const values = await this.immediatelyPersistValuesToDisk()

    /** Save the persisted value so we have access to it in memory (for unit tests afawk) */
    this.values[ValueModesKeys.Wrapped] = values[ValueModesKeys.Wrapped]
  }

  public async awaitPersist(): Promise<void> {
    await this.currentPersistPromise
  }

  private async immediatelyPersistValuesToDisk(): Promise<StorageValuesObject> {
    this.currentPersistPromise = this.executeCriticalFunction(async () => {
      const values = await this.generatePersistableValues()

      const persistencePolicySuddenlyChanged = this.persistencePolicy === StoragePersistencePolicies.Ephemeral
      if (persistencePolicySuddenlyChanged) {
        return values
      }

      await this.device?.setRawStorageValue(this.getPersistenceKey(), JSON.stringify(values))

      return values
    })

    return this.currentPersistPromise
  }

  /**
   * Generates a payload that can be persisted to disk,
   * either as a plain object, or an encrypted item.
   */
  private async generatePersistableValues() {
    const rawContent = <Partial<StorageValuesObject>>Copy(this.values)

    const valuesToWrap = rawContent[ValueModesKeys.Unwrapped]
    rawContent[ValueModesKeys.Unwrapped] = undefined

    const payload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content: valuesToWrap as unknown as ItemContent,
      content_type: ContentType.TYPES.EncryptedStorage,
      ...PayloadTimestampDefaults(),
    })

    if (this.encryptionProvider.hasRootKeyEncryptionSource()) {
      const split: KeyedEncryptionSplit = {
        usesRootKeyWithKeyLookup: {
          items: [payload],
        },
      }

      const encryptedPayload = await this.encryptionProvider.encryptSplitSingle(split)

      rawContent[ValueModesKeys.Wrapped] = CreateEncryptedLocalStorageContextPayload(encryptedPayload)
    } else {
      rawContent[ValueModesKeys.Wrapped] = CreateDecryptedLocalStorageContextPayload(payload)
    }

    return rawContent as StorageValuesObject
  }

  public setValue<T>(key: string, value: T, mode = StorageValueModes.Default): void {
    this.setValueWithNoPersist(key, value, mode)

    void this.persistValuesToDisk()
  }

  public async setValueAndAwaitPersist(key: string, value: unknown, mode = StorageValueModes.Default): Promise<void> {
    this.setValueWithNoPersist(key, value, mode)

    await this.persistValuesToDisk()
  }

  private setValueWithNoPersist(key: string, value: unknown, mode = StorageValueModes.Default): void {
    if (!this.values) {
      throw Error(`Attempting to set storage key ${key} before loading local storage.`)
    }

    const domainKey = this.domainKeyForMode(mode)
    const domainStorage = this.values[domainKey]
    domainStorage[key] = value
  }

  public getValue<T>(key: string, mode = StorageValueModes.Default, defaultValue?: T): T {
    if (!this.values) {
      throw Error(`Attempting to get storage key ${key} before loading local storage.`)
    }

    if (!this.values[this.domainKeyForMode(mode)]) {
      throw Error(`Storage domain mode not available ${mode} for key ${key}`)
    }

    const value = this.values[this.domainKeyForMode(mode)][key]

    return value != undefined ? (value as T) : (defaultValue as T)
  }

  public getAllKeys(mode = StorageValueModes.Default): string[] {
    if (!this.values) {
      throw Error('Attempting to get all keys before loading local storage.')
    }

    return Object.keys(this.values[this.domainKeyForMode(mode)])
  }

  public async removeValue(key: string, mode = StorageValueModes.Default): Promise<void> {
    if (!this.values) {
      throw Error(`Attempting to remove storage key ${key} before loading local storage.`)
    }

    const domain = this.values[this.domainKeyForMode(mode)]

    if (domain?.[key]) {
      delete domain[key]
      return this.persistValuesToDisk()
    }
  }

  /**
   * Default persistence key. Platforms can override as needed.
   */
  private getPersistenceKey() {
    return namespacedKey(this.identifier, RawStorageKey.StorageObject)
  }

  private defaultValuesObject(
    wrapped?: WrappedStorageValue,
    unwrapped?: ValuesObjectRecord,
    nonwrapped?: ValuesObjectRecord,
  ) {
    return DiskStorageService.DefaultValuesObject(wrapped, unwrapped, nonwrapped)
  }

  public static DefaultValuesObject(
    wrapped: WrappedStorageValue = {} as WrappedStorageValue,
    unwrapped: ValuesObjectRecord = {},
    nonwrapped: ValuesObjectRecord = {},
  ) {
    return {
      [ValueModesKeys.Wrapped]: wrapped,
      [ValueModesKeys.Unwrapped]: unwrapped,
      [ValueModesKeys.Nonwrapped]: nonwrapped,
    } as StorageValuesObject
  }

  private domainKeyForMode(mode: StorageValueModes) {
    if (mode === StorageValueModes.Default) {
      return ValueModesKeys.Unwrapped
    } else if (mode === StorageValueModes.Nonwrapped) {
      return ValueModesKeys.Nonwrapped
    } else {
      throw Error('Invalid mode')
    }
  }

  /**
   * Clears simple values from storage only. Does not affect payloads.
   */
  async clearValues() {
    await this.setInitialValues()
    await this.immediatelyPersistValuesToDisk()
  }

  public async getAllRawPayloads(): Promise<FullyFormedTransferPayload[]> {
    return this.device.getAllDatabaseEntries(this.identifier)
  }

  public async getRawPayloads(uuids: string[]): Promise<FullyFormedTransferPayload[]> {
    return this.device.getDatabaseEntries(this.identifier, uuids)
  }

  public async savePayload(payload: FullyFormedPayloadInterface): Promise<void> {
    return this.savePayloads([payload])
  }

  public async savePayloads(payloads: FullyFormedPayloadInterface[]): Promise<void> {
    if (this.persistencePolicy === StoragePersistencePolicies.Ephemeral) {
      return
    }

    const { encrypted, decrypted, deleted, discardable } = CreatePayloadSplitWithDiscardables(payloads)

    const rootKeyEncryptionAvailable = this.encryptionProvider.hasRootKeyEncryptionSource()

    const encryptable: DecryptedPayloadInterface[] = []
    const unencryptable: DecryptedPayloadInterface[] = []

    const { rootKeyEncryption, keySystemRootKeyEncryption, itemsKeyEncryption } =
      SplitPayloadsByEncryptionType(decrypted)

    if (itemsKeyEncryption) {
      extendArray(encryptable, itemsKeyEncryption)
    }

    if (keySystemRootKeyEncryption) {
      extendArray(encryptable, keySystemRootKeyEncryption)
    }

    if (rootKeyEncryption) {
      if (!rootKeyEncryptionAvailable) {
        extendArray(unencryptable, rootKeyEncryption)
      } else {
        extendArray(encryptable, rootKeyEncryption)
      }
    }

    if (discardable.length > 0) {
      await this.deletePayloads(discardable)
    }

    const encryptableSplit = SplitPayloadsByEncryptionType(encryptable)

    const keyLookupSplit = CreateEncryptionSplitWithKeyLookup(encryptableSplit)

    const encryptedResults = await this.encryptionProvider.encryptSplit(keyLookupSplit)

    const exportedEncrypted = [...encrypted, ...encryptedResults].map(CreateEncryptedLocalStorageContextPayload)

    const exportedDecrypted = unencryptable.map(CreateDecryptedLocalStorageContextPayload)

    const exportedDeleted = deleted.map(CreateDeletedLocalStorageContextPayload)

    return this.executeCriticalFunction(async () => {
      return this.device?.saveDatabaseEntries(
        [...exportedEncrypted, ...exportedDecrypted, ...exportedDeleted],
        this.identifier,
      )
    })
  }

  public async deletePayloads(payloads: DeletedPayloadInterface[]) {
    await this.deletePayloadsWithUuids(Uuids(payloads))
  }

  public async deletePayloadsWithUuids(uuids: string[]): Promise<void> {
    await this.executeCriticalFunction(async () => {
      await Promise.all(uuids.map((uuid) => this.device.removeDatabaseEntry(uuid, this.identifier)))
    })
  }

  public async deletePayloadWithUuid(uuid: string) {
    return this.executeCriticalFunction(async () => {
      await this.device.removeDatabaseEntry(uuid, this.identifier)
    })
  }

  public async clearAllPayloads() {
    return this.executeCriticalFunction(async () => {
      return this.device.removeAllDatabaseEntries(this.identifier)
    })
  }

  public clearAllData(): Promise<void> {
    return this.executeCriticalFunction(async () => {
      await this.clearValues()
      await this.clearAllPayloads()

      await this.device.removeRawStorageValue(namespacedKey(this.identifier, RawStorageKey.SnjsVersion))

      await this.device.removeRawStorageValue(this.getPersistenceKey())
    })
  }
}
