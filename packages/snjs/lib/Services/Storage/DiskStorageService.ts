import { ContentType, Uuid } from '@standardnotes/common'
import { Copy, extendArray, UuidGenerator } from '@standardnotes/utils'
import { SNLog } from '../../Log'
import { isErrorDecryptingParameters, SNRootKey } from '@standardnotes/encryption'
import * as Encryption from '@standardnotes/encryption'
import * as Services from '@standardnotes/services'
import { DiagnosticInfo, Environment } from '@standardnotes/services'
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
} from '@standardnotes/models'

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
export class DiskStorageService extends Services.AbstractService implements Services.StorageServiceInterface {
  private encryptionProvider!: Encryption.EncryptionProvider
  private storagePersistable = false
  private persistencePolicy!: Services.StoragePersistencePolicies
  private encryptionPolicy!: Services.StorageEncryptionPolicy
  private needsPersist = false
  private currentPersistPromise?: Promise<Services.StorageValuesObject>

  private values!: Services.StorageValuesObject

  constructor(
    private deviceInterface: Services.DeviceInterface,
    private identifier: string,
    private environment: Environment,
    protected override internalEventBus: Services.InternalEventBusInterface,
  ) {
    super(internalEventBus)
    void this.setPersistencePolicy(Services.StoragePersistencePolicies.Default)
    void this.setEncryptionPolicy(Services.StorageEncryptionPolicy.Default, false)
  }

  public provideEncryptionProvider(provider: Encryption.EncryptionProvider): void {
    this.encryptionProvider = provider
  }

  public override deinit() {
    ;(this.deviceInterface as unknown) = undefined
    ;(this.encryptionProvider as unknown) = undefined
    this.storagePersistable = false
    super.deinit()
  }

  override async handleApplicationStage(stage: Services.ApplicationStage) {
    await super.handleApplicationStage(stage)

    if (stage === Services.ApplicationStage.Launched_10) {
      this.storagePersistable = true
      if (this.needsPersist) {
        void this.persistValuesToDisk()
      }
    } else if (stage === Services.ApplicationStage.StorageDecrypted_09) {
      const persistedPolicy = await this.getValue(Services.StorageKey.StorageEncryptionPolicy)
      if (persistedPolicy) {
        void this.setEncryptionPolicy(persistedPolicy as Services.StorageEncryptionPolicy, false)
      }
    }
  }

  public async setPersistencePolicy(persistencePolicy: Services.StoragePersistencePolicies) {
    this.persistencePolicy = persistencePolicy

    if (this.persistencePolicy === Services.StoragePersistencePolicies.Ephemeral) {
      await this.deviceInterface.removeAllRawStorageValues()
      await this.clearAllPayloads()
    }
  }

  public setEncryptionPolicy(encryptionPolicy: Services.StorageEncryptionPolicy, persist = true): void {
    if (
      encryptionPolicy === Services.StorageEncryptionPolicy.Disabled &&
      ![Environment.Mobile, Environment.NativeMobileWeb].includes(this.environment)
    ) {
      throw Error('Disabling storage encryption is only available on mobile.')
    }

    this.encryptionPolicy = encryptionPolicy

    if (persist) {
      this.setValue(Services.StorageKey.StorageEncryptionPolicy, encryptionPolicy)
    }
  }

  public isEphemeralSession() {
    return this.persistencePolicy === Services.StoragePersistencePolicies.Ephemeral
  }

  public async initializeFromDisk() {
    const value = await this.deviceInterface.getRawStorageValue(this.getPersistenceKey())
    const values = value ? JSON.parse(value as string) : undefined

    this.setInitialValues(values)
  }

  /**
   * Called by platforms with the value they load from disk,
   * after they handle initializeFromDisk
   */
  private setInitialValues(values?: Services.StorageValuesObject) {
    const sureValues = values || this.defaultValuesObject()

    if (!sureValues[Services.ValueModesKeys.Unwrapped]) {
      sureValues[Services.ValueModesKeys.Unwrapped] = {}
    }

    this.values = sureValues
  }

  public isStorageWrapped(): boolean {
    const wrappedValue = this.values[Services.ValueModesKeys.Wrapped]

    return wrappedValue != undefined && isEncryptedLocalStoragePayload(wrappedValue)
  }

  public async canDecryptWithKey(key: SNRootKey): Promise<boolean> {
    const wrappedValue = this.values[Services.ValueModesKeys.Wrapped]

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
      content_type: ContentType.EncryptedStorage,
    })

    const split: Encryption.KeyedDecryptionSplit = key
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

  public async decryptStorage() {
    const wrappedValue = this.values[Services.ValueModesKeys.Wrapped]

    if (!isEncryptedLocalStoragePayload(wrappedValue)) {
      throw Error('Attempting to decrypt already decrypted storage')
    }

    const decryptedPayload = await this.decryptWrappedValue(wrappedValue)

    if (isErrorDecryptingParameters(decryptedPayload)) {
      throw SNLog.error(Error('Unable to decrypt storage.'))
    }

    this.values[Services.ValueModesKeys.Unwrapped] = Copy(decryptedPayload.content)
  }

  /** @todo This function should be debounced. */
  private async persistValuesToDisk() {
    if (!this.storagePersistable) {
      this.needsPersist = true
      return
    }

    if (this.persistencePolicy === Services.StoragePersistencePolicies.Ephemeral) {
      return
    }

    await this.currentPersistPromise

    this.needsPersist = false

    const values = await this.immediatelyPersistValuesToDisk()

    /** Save the persisted value so we have access to it in memory (for unit tests afawk) */
    this.values[Services.ValueModesKeys.Wrapped] = values[Services.ValueModesKeys.Wrapped]
  }

  public async awaitPersist(): Promise<void> {
    await this.currentPersistPromise
  }

  private async immediatelyPersistValuesToDisk(): Promise<Services.StorageValuesObject> {
    this.currentPersistPromise = this.executeCriticalFunction(async () => {
      const values = await this.generatePersistableValues()

      const persistencePolicySuddenlyChanged = this.persistencePolicy === Services.StoragePersistencePolicies.Ephemeral
      if (persistencePolicySuddenlyChanged) {
        return values
      }

      await this.deviceInterface?.setRawStorageValue(this.getPersistenceKey(), JSON.stringify(values))

      return values
    })

    return this.currentPersistPromise
  }

  /**
   * Generates a payload that can be persisted to disk,
   * either as a plain object, or an encrypted item.
   */
  private async generatePersistableValues() {
    const rawContent = Copy(this.values) as Partial<Services.StorageValuesObject>

    const valuesToWrap = rawContent[Services.ValueModesKeys.Unwrapped]
    rawContent[Services.ValueModesKeys.Unwrapped] = undefined

    const payload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content: valuesToWrap as unknown as ItemContent,
      content_type: ContentType.EncryptedStorage,
      ...PayloadTimestampDefaults(),
    })

    if (this.encryptionProvider.hasRootKeyEncryptionSource()) {
      const split: Encryption.KeyedEncryptionSplit = {
        usesRootKeyWithKeyLookup: {
          items: [payload],
        },
      }

      const encryptedPayload = await this.encryptionProvider.encryptSplitSingle(split)

      rawContent[Services.ValueModesKeys.Wrapped] = CreateEncryptedLocalStorageContextPayload(encryptedPayload)
    } else {
      rawContent[Services.ValueModesKeys.Wrapped] = CreateDecryptedLocalStorageContextPayload(payload)
    }

    return rawContent as Services.StorageValuesObject
  }

  public setValue(key: string, value: unknown, mode = Services.StorageValueModes.Default): void {
    this.setValueWithNoPersist(key, value, mode)

    void this.persistValuesToDisk()
  }

  public async setValueAndAwaitPersist(
    key: string,
    value: unknown,
    mode = Services.StorageValueModes.Default,
  ): Promise<void> {
    this.setValueWithNoPersist(key, value, mode)

    await this.persistValuesToDisk()
  }

  private setValueWithNoPersist(key: string, value: unknown, mode = Services.StorageValueModes.Default): void {
    if (!this.values) {
      throw Error(`Attempting to set storage key ${key} before loading local storage.`)
    }

    const domainKey = this.domainKeyForMode(mode)
    const domainStorage = this.values[domainKey]
    domainStorage[key] = value
  }

  public getValue<T>(key: string, mode = Services.StorageValueModes.Default, defaultValue?: T): T {
    if (!this.values) {
      throw Error(`Attempting to get storage key ${key} before loading local storage.`)
    }

    if (!this.values[this.domainKeyForMode(mode)]) {
      throw Error(`Storage domain mode not available ${mode} for key ${key}`)
    }

    const value = this.values[this.domainKeyForMode(mode)][key]

    return value != undefined ? (value as T) : (defaultValue as T)
  }

  public async removeValue(key: string, mode = Services.StorageValueModes.Default): Promise<void> {
    if (!this.values) {
      throw Error(`Attempting to remove storage key ${key} before loading local storage.`)
    }

    const domain = this.values[this.domainKeyForMode(mode)]

    if (domain?.[key]) {
      delete domain[key]
      return this.persistValuesToDisk()
    }
  }

  public getStorageEncryptionPolicy() {
    return this.encryptionPolicy
  }

  /**
   * Default persistence key. Platforms can override as needed.
   */
  private getPersistenceKey() {
    return Services.namespacedKey(this.identifier, Services.RawStorageKey.StorageObject)
  }

  private defaultValuesObject(
    wrapped?: Services.WrappedStorageValue,
    unwrapped?: Services.ValuesObjectRecord,
    nonwrapped?: Services.ValuesObjectRecord,
  ) {
    return DiskStorageService.DefaultValuesObject(wrapped, unwrapped, nonwrapped)
  }

  public static DefaultValuesObject(
    wrapped: Services.WrappedStorageValue = {} as Services.WrappedStorageValue,
    unwrapped: Services.ValuesObjectRecord = {},
    nonwrapped: Services.ValuesObjectRecord = {},
  ) {
    return {
      [Services.ValueModesKeys.Wrapped]: wrapped,
      [Services.ValueModesKeys.Unwrapped]: unwrapped,
      [Services.ValueModesKeys.Nonwrapped]: nonwrapped,
    } as Services.StorageValuesObject
  }

  private domainKeyForMode(mode: Services.StorageValueModes) {
    if (mode === Services.StorageValueModes.Default) {
      return Services.ValueModesKeys.Unwrapped
    } else if (mode === Services.StorageValueModes.Nonwrapped) {
      return Services.ValueModesKeys.Nonwrapped
    } else {
      throw Error('Invalid mode')
    }
  }

  /**
   * Clears simple values from storage only. Does not affect payloads.
   */
  async clearValues() {
    this.setInitialValues()
    await this.immediatelyPersistValuesToDisk()
  }

  public async getAllRawPayloads() {
    return this.deviceInterface.getAllRawDatabasePayloads(this.identifier)
  }

  public async savePayload(payload: FullyFormedPayloadInterface): Promise<void> {
    return this.savePayloads([payload])
  }

  public async savePayloads(payloads: FullyFormedPayloadInterface[]): Promise<void> {
    if (this.persistencePolicy === Services.StoragePersistencePolicies.Ephemeral) {
      return
    }

    const { encrypted, decrypted, deleted, discardable } = CreatePayloadSplitWithDiscardables(payloads)

    const encryptionEnabled = this.encryptionPolicy === Services.StorageEncryptionPolicy.Default
    const rootKeyEncryptionAvailable = this.encryptionProvider.hasRootKeyEncryptionSource()

    const encryptable: DecryptedPayloadInterface[] = []
    const unencryptable: DecryptedPayloadInterface[] = []

    if (encryptionEnabled) {
      const split = Encryption.SplitPayloadsByEncryptionType(decrypted)

      if (split.itemsKeyEncryption) {
        extendArray(encryptable, split.itemsKeyEncryption)
      }

      if (split.rootKeyEncryption) {
        if (!rootKeyEncryptionAvailable) {
          extendArray(unencryptable, split.rootKeyEncryption)
        } else {
          extendArray(encryptable, split.rootKeyEncryption)
        }
      }
    } else {
      extendArray(unencryptable, encryptable)
      extendArray(unencryptable, decrypted)
    }

    await this.deletePayloads(discardable)

    const split = Encryption.SplitPayloadsByEncryptionType(encryptable)

    const keyLookupSplit = Encryption.CreateEncryptionSplitWithKeyLookup(split)

    const encryptedResults = await this.encryptionProvider.encryptSplit(keyLookupSplit)

    const exportedEncrypted = [...encrypted, ...encryptedResults].map(CreateEncryptedLocalStorageContextPayload)

    const exportedDecrypted = unencryptable.map(CreateDecryptedLocalStorageContextPayload)

    const exportedDeleted = deleted.map(CreateDeletedLocalStorageContextPayload)

    return this.executeCriticalFunction(async () => {
      return this.deviceInterface?.saveRawDatabasePayloads(
        [...exportedEncrypted, ...exportedDecrypted, ...exportedDeleted],
        this.identifier,
      )
    })
  }

  public async deletePayloads(payloads: DeletedPayloadInterface[]) {
    await Promise.all(payloads.map((payload) => this.deletePayloadWithId(payload.uuid)))
  }

  public async forceDeletePayloads(payloads: FullyFormedPayloadInterface[]) {
    await Promise.all(payloads.map((payload) => this.deletePayloadWithId(payload.uuid)))
  }

  public async deletePayloadWithId(uuid: Uuid) {
    return this.executeCriticalFunction(async () => {
      return this.deviceInterface.removeRawDatabasePayloadWithId(uuid, this.identifier)
    })
  }

  public async clearAllPayloads() {
    return this.executeCriticalFunction(async () => {
      return this.deviceInterface.removeAllRawDatabasePayloads(this.identifier)
    })
  }

  public clearAllData(): Promise<void> {
    return this.executeCriticalFunction(async () => {
      await this.clearValues()
      await this.clearAllPayloads()

      await this.deviceInterface.removeRawStorageValue(
        Services.namespacedKey(this.identifier, Services.RawStorageKey.SnjsVersion),
      )

      await this.deviceInterface.removeRawStorageValue(this.getPersistenceKey())
    })
  }

  override async getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return {
      storage: {
        storagePersistable: this.storagePersistable,
        persistencePolicy: Services.StoragePersistencePolicies[this.persistencePolicy],
        encryptionPolicy: Services.StorageEncryptionPolicy[this.encryptionPolicy],
        needsPersist: this.needsPersist,
        currentPersistPromise: this.currentPersistPromise != undefined,
        isStorageWrapped: this.isStorageWrapped(),
        allRawPayloadsCount: (await this.getAllRawPayloads()).length,
        databaseKeys: await this.deviceInterface.getDatabaseKeys(),
      },
    }
  }
}
