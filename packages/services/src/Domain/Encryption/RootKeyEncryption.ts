import {
  ApplicationIdentifier,
  ProtocolVersionLatest,
  ProtocolVersion,
  AnyKeyParamsContent,
  KeyParamsOrigination,
  compareVersions,
  ProtocolVersionLastNonrootItemsKey,
  ContentType,
} from '@standardnotes/common'
import {
  RootKeyServiceEvent,
  KeyMode,
  SNRootKeyParams,
  OperatorManager,
  CreateNewRootKey,
  CreateAnyKeyParams,
  SNRootKey,
  isErrorDecryptingParameters,
  EncryptedParameters,
  DecryptedParameters,
  ErrorDecryptingParameters,
  findDefaultItemsKey,
  ItemsKeyMutator,
  encryptPayload,
  decryptPayload,
} from '@standardnotes/encryption'
import {
  CreateDecryptedItemFromPayload,
  DecryptedPayload,
  DecryptedPayloadInterface,
  DecryptedTransferPayload,
  EncryptedPayload,
  EncryptedPayloadInterface,
  EncryptedTransferPayload,
  FillItemContentSpecialized,
  ItemContent,
  ItemsKeyContent,
  ItemsKeyContentSpecialized,
  ItemsKeyInterface,
  NamespacedRootKeyInKeychain,
  PayloadTimestampDefaults,
  RootKeyContent,
  RootKeyInterface,
} from '@standardnotes/models'
import { UuidGenerator } from '@standardnotes/utils'

import { DeviceInterface } from '../Device/DeviceInterface'
import { DiagnosticInfo } from '../Diagnostics/ServiceDiagnostics'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { AbstractService } from '../Service/AbstractService'
import { StorageKey } from '../Storage/StorageKeys'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageValueModes } from '../Storage/StorageTypes'

export class RootKeyEncryptionService extends AbstractService<RootKeyServiceEvent> {
  private rootKey?: RootKeyInterface
  public keyMode = KeyMode.RootKeyNone
  public memoizedRootKeyParams?: SNRootKeyParams

  constructor(
    private itemManager: ItemManagerInterface,
    private operatorManager: OperatorManager,
    public deviceInterface: DeviceInterface,
    private storageService: StorageServiceInterface,
    private identifier: ApplicationIdentifier,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    this.rootKey = undefined
    this.memoizedRootKeyParams = undefined
    super.deinit()
  }

  public async initialize() {
    const wrappedRootKey = this.getWrappedRootKey()
    const accountKeyParams = await this.recomputeAccountKeyParams()
    const hasWrapper = await this.hasRootKeyWrapper()
    const hasRootKey = wrappedRootKey != undefined || accountKeyParams != undefined

    if (hasWrapper && hasRootKey) {
      this.keyMode = KeyMode.RootKeyPlusWrapper
    } else if (hasWrapper && !hasRootKey) {
      this.keyMode = KeyMode.WrapperOnly
    } else if (!hasWrapper && hasRootKey) {
      this.keyMode = KeyMode.RootKeyOnly
    } else if (!hasWrapper && !hasRootKey) {
      this.keyMode = KeyMode.RootKeyNone
    } else {
      throw 'Invalid key mode condition'
    }

    if (this.keyMode === KeyMode.RootKeyOnly) {
      this.setRootKeyInstance(await this.getRootKeyFromKeychain())
      await this.handleKeyStatusChange()
    }
  }

  private async handleKeyStatusChange() {
    await this.recomputeAccountKeyParams()
    void this.notifyEvent(RootKeyServiceEvent.RootKeyStatusChanged)
  }

  public async passcodeUpgradeAvailable() {
    const passcodeParams = await this.getRootKeyWrapperKeyParams()
    if (!passcodeParams) {
      return false
    }
    return passcodeParams.version !== ProtocolVersionLatest
  }

  public async hasRootKeyWrapper() {
    const wrapper = await this.getRootKeyWrapperKeyParams()
    return wrapper != undefined
  }

  public hasAccount() {
    switch (this.keyMode) {
      case KeyMode.RootKeyNone:
      case KeyMode.WrapperOnly:
        return false
      case KeyMode.RootKeyOnly:
      case KeyMode.RootKeyPlusWrapper:
        return true
      default:
        throw Error(`Unhandled keyMode value '${this.keyMode}'.`)
    }
  }

  public hasRootKeyEncryptionSource(): boolean {
    return this.hasAccount() || this.hasPasscode()
  }

  public hasPasscode() {
    return this.keyMode === KeyMode.WrapperOnly || this.keyMode === KeyMode.RootKeyPlusWrapper
  }

  public async getEncryptionSourceVersion(): Promise<ProtocolVersion> {
    if (this.hasAccount()) {
      return this.getSureUserVersion()
    } else if (this.hasPasscode()) {
      const passcodeParams = await this.getSureRootKeyWrapperKeyParams()
      return passcodeParams.version
    }

    throw Error('Attempting to access encryption source version without source')
  }

  public getUserVersion(): ProtocolVersion | undefined {
    const keyParams = this.memoizedRootKeyParams
    return keyParams?.version
  }

  private getSureUserVersion(): ProtocolVersion {
    const keyParams = this.memoizedRootKeyParams as SNRootKeyParams
    return keyParams.version
  }

  private async getRootKeyFromKeychain() {
    const rawKey = (await this.deviceInterface.getNamespacedKeychainValue(this.identifier)) as
      | NamespacedRootKeyInKeychain
      | undefined

    if (rawKey == undefined) {
      return undefined
    }

    const keyParams = await this.getSureRootKeyParams()

    return CreateNewRootKey({
      ...rawKey,
      keyParams: keyParams.getPortableValue(),
    })
  }

  private async saveRootKeyToKeychain() {
    if (this.getRootKey() == undefined) {
      throw 'Attempting to non-existent root key to the keychain.'
    }
    if (this.keyMode !== KeyMode.RootKeyOnly) {
      throw 'Should not be persisting wrapped key to keychain.'
    }

    const rawKey = this.getSureRootKey().getKeychainValue()

    return this.executeCriticalFunction(() => {
      return this.deviceInterface.setNamespacedKeychainValue(rawKey, this.identifier)
    })
  }

  public async getRootKeyWrapperKeyParams(): Promise<SNRootKeyParams | undefined> {
    const rawKeyParams = await this.storageService.getValue(
      StorageKey.RootKeyWrapperKeyParams,
      StorageValueModes.Nonwrapped,
    )

    if (!rawKeyParams) {
      return undefined
    }

    return CreateAnyKeyParams(rawKeyParams as AnyKeyParamsContent)
  }

  public async getSureRootKeyWrapperKeyParams() {
    return this.getRootKeyWrapperKeyParams() as Promise<SNRootKeyParams>
  }

  public async getRootKeyParams(): Promise<SNRootKeyParams | undefined> {
    if (this.keyMode === KeyMode.WrapperOnly) {
      return this.getRootKeyWrapperKeyParams()
    } else if (this.keyMode === KeyMode.RootKeyOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      return this.recomputeAccountKeyParams()
    } else if (this.keyMode === KeyMode.RootKeyNone) {
      return undefined
    } else {
      throw `Unhandled key mode for getRootKeyParams ${this.keyMode}`
    }
  }

  public async getSureRootKeyParams(): Promise<SNRootKeyParams> {
    return this.getRootKeyParams() as Promise<SNRootKeyParams>
  }

  public async computeRootKey(password: string, keyParams: SNRootKeyParams): Promise<RootKeyInterface> {
    const version = keyParams.version
    const operator = this.operatorManager.operatorForVersion(version)
    return operator.computeRootKey(password, keyParams)
  }

  public async createRootKey(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
    version?: ProtocolVersion,
  ) {
    const operator = version ? this.operatorManager.operatorForVersion(version) : this.operatorManager.defaultOperator()
    return operator.createRootKey(identifier, password, origination)
  }

  private getSureMemoizedRootKeyParams(): SNRootKeyParams {
    return this.memoizedRootKeyParams as SNRootKeyParams
  }

  public async validateAccountPassword(password: string) {
    const key = await this.computeRootKey(password, this.getSureMemoizedRootKeyParams())
    const valid = this.getSureRootKey().compare(key)
    if (valid) {
      return { valid, artifacts: { rootKey: key } }
    } else {
      return { valid: false }
    }
  }

  public async validatePasscode(passcode: string) {
    const keyParams = await this.getSureRootKeyWrapperKeyParams()
    const key = await this.computeRootKey(passcode, keyParams)
    const valid = await this.validateWrappingKey(key)
    if (valid) {
      return { valid, artifacts: { wrappingKey: key } }
    } else {
      return { valid: false }
    }
  }

  /**
   * We know a wrappingKey is correct if it correctly decrypts
   * wrapped root key.
   */
  public async validateWrappingKey(wrappingKey: SNRootKey) {
    const wrappedRootKey = this.getWrappedRootKey()

    /** If wrapper only, storage is encrypted directly with wrappingKey */
    if (this.keyMode === KeyMode.WrapperOnly) {
      return this.storageService.canDecryptWithKey(wrappingKey)
    } else if (this.keyMode === KeyMode.RootKeyOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      /**
       * In these modes, storage is encrypted with account keys, and
       * account keys are encrypted with wrappingKey. Here we validate
       * by attempting to decrypt account keys.
       */
      const wrappedKeyPayload = new EncryptedPayload(wrappedRootKey)
      const decrypted = await this.decryptPayload(wrappedKeyPayload, wrappingKey)
      return !isErrorDecryptingParameters(decrypted)
    } else {
      throw 'Unhandled case in validateWrappingKey'
    }
  }

  private async recomputeAccountKeyParams(): Promise<SNRootKeyParams | undefined> {
    const rawKeyParams = await this.storageService.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)

    if (!rawKeyParams) {
      return
    }

    this.memoizedRootKeyParams = CreateAnyKeyParams(rawKeyParams as AnyKeyParamsContent)
    return this.memoizedRootKeyParams
  }

  /**
   * Wraps the current in-memory root key value using the wrappingKey,
   * then persists the wrapped value to disk.
   */
  private async wrapAndPersistRootKey(wrappingKey: SNRootKey) {
    const rootKey = this.getSureRootKey()
    const value: DecryptedTransferPayload = {
      ...rootKey.payload.ejected(),
      content: FillItemContentSpecialized(rootKey.persistableValueWhenWrapping()),
    }
    const payload = new DecryptedPayload(value)

    const wrappedKey = await this.encryptPayload(payload, wrappingKey)
    const wrappedKeyPayload = new EncryptedPayload({
      ...payload.ejected(),
      ...wrappedKey,
      errorDecrypting: false,
      waitingForKey: false,
    })

    this.storageService.setValue(StorageKey.WrappedRootKey, wrappedKeyPayload.ejected(), StorageValueModes.Nonwrapped)
  }

  public async unwrapRootKey(wrappingKey: RootKeyInterface) {
    if (this.keyMode === KeyMode.WrapperOnly) {
      this.setRootKeyInstance(wrappingKey)
      return
    }

    if (this.keyMode !== KeyMode.RootKeyPlusWrapper) {
      throw 'Invalid key mode condition for unwrapping.'
    }

    const wrappedKey = this.getWrappedRootKey()
    const payload = new EncryptedPayload(wrappedKey)
    const decrypted = await this.decryptPayload<RootKeyContent>(payload, wrappingKey)

    if (isErrorDecryptingParameters(decrypted)) {
      throw Error('Unable to decrypt root key with provided wrapping key.')
    } else {
      const decryptedPayload = new DecryptedPayload<RootKeyContent>({
        ...payload.ejected(),
        ...decrypted,
      })
      this.setRootKeyInstance(new SNRootKey(decryptedPayload))
      await this.handleKeyStatusChange()
    }
  }

  /**
   * Encrypts rootKey and saves it in storage instead of keychain, and then
   * clears keychain. This is because we don't want to store large encrypted
   * payloads in the keychain. If the root key is not wrapped, it is stored
   * in plain form in the user's secure keychain.
   */
  public async setNewRootKeyWrapper(wrappingKey: SNRootKey) {
    if (this.keyMode === KeyMode.RootKeyNone) {
      this.keyMode = KeyMode.WrapperOnly
    } else if (this.keyMode === KeyMode.RootKeyOnly) {
      this.keyMode = KeyMode.RootKeyPlusWrapper
    } else {
      throw Error('Attempting to set wrapper on already wrapped key.')
    }

    await this.deviceInterface.clearNamespacedKeychainValue(this.identifier)

    if (this.keyMode === KeyMode.WrapperOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      if (this.keyMode === KeyMode.WrapperOnly) {
        this.setRootKeyInstance(wrappingKey)
        await this.reencryptItemsKeys()
      } else {
        await this.wrapAndPersistRootKey(wrappingKey)
      }

      this.storageService.setValue(
        StorageKey.RootKeyWrapperKeyParams,
        wrappingKey.keyParams.getPortableValue(),
        StorageValueModes.Nonwrapped,
      )

      await this.handleKeyStatusChange()
    } else {
      throw Error('Invalid keyMode on setNewRootKeyWrapper')
    }
  }

  /**
   * Removes root key wrapper from local storage and stores root key bare in secure keychain.
   */
  public async removeRootKeyWrapper(): Promise<void> {
    if (this.keyMode !== KeyMode.WrapperOnly && this.keyMode !== KeyMode.RootKeyPlusWrapper) {
      throw Error('Attempting to remove root key wrapper on unwrapped key.')
    }

    if (this.keyMode === KeyMode.WrapperOnly) {
      this.keyMode = KeyMode.RootKeyNone
      this.setRootKeyInstance(undefined)
    } else if (this.keyMode === KeyMode.RootKeyPlusWrapper) {
      this.keyMode = KeyMode.RootKeyOnly
    }

    await this.storageService.removeValue(StorageKey.WrappedRootKey, StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)

    if (this.keyMode === KeyMode.RootKeyOnly) {
      await this.saveRootKeyToKeychain()
    }

    await this.handleKeyStatusChange()
  }

  public async setRootKey(key: SNRootKey, wrappingKey?: SNRootKey) {
    if (!key.keyParams) {
      throw Error('keyParams must be supplied if setting root key.')
    }

    if (this.getRootKey() === key) {
      throw Error('Attempting to set root key as same current value.')
    }

    if (this.keyMode === KeyMode.WrapperOnly) {
      this.keyMode = KeyMode.RootKeyPlusWrapper
    } else if (this.keyMode === KeyMode.RootKeyNone) {
      this.keyMode = KeyMode.RootKeyOnly
    } else if (this.keyMode === KeyMode.RootKeyOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      /** Root key is simply changing, mode stays the same */
      /** this.keyMode = this.keyMode; */
    } else {
      throw Error(`Unhandled key mode for setNewRootKey ${this.keyMode}`)
    }

    this.setRootKeyInstance(key)

    this.storageService.setValue(
      StorageKey.RootKeyParams,
      key.keyParams.getPortableValue(),
      StorageValueModes.Nonwrapped,
    )

    if (this.keyMode === KeyMode.RootKeyOnly) {
      await this.saveRootKeyToKeychain()
    } else if (this.keyMode === KeyMode.RootKeyPlusWrapper) {
      if (!wrappingKey) {
        throw Error('wrappingKey must be supplied')
      }
      await this.wrapAndPersistRootKey(wrappingKey)
    }

    await this.handleKeyStatusChange()
  }

  /**
   * Deletes root key and wrapper from keychain. Used when signing out of application.
   */
  public async deleteWorkspaceSpecificKeyStateFromDevice() {
    await this.deviceInterface.clearNamespacedKeychainValue(this.identifier)
    await this.storageService.removeValue(StorageKey.WrappedRootKey, StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    this.keyMode = KeyMode.RootKeyNone
    this.setRootKeyInstance(undefined)

    await this.handleKeyStatusChange()
  }

  private getWrappedRootKey() {
    return this.storageService.getValue<EncryptedTransferPayload>(
      StorageKey.WrappedRootKey,
      StorageValueModes.Nonwrapped,
    )
  }

  public setRootKeyInstance(rootKey: RootKeyInterface | undefined): void {
    this.rootKey = rootKey
  }

  public getRootKey(): RootKeyInterface | undefined {
    return this.rootKey
  }

  private getSureRootKey(): RootKeyInterface {
    return this.rootKey as RootKeyInterface
  }

  private getItemsKeys() {
    return this.itemManager.getDisplayableItemsKeys()
  }

  public async encrypPayloadWithKeyLookup(payload: DecryptedPayloadInterface): Promise<EncryptedParameters> {
    const key = this.getRootKey()

    if (key == undefined) {
      throw Error('Attempting root key encryption with no root key')
    }

    return this.encryptPayload(payload, key)
  }

  public async encryptPayloadsWithKeyLookup(payloads: DecryptedPayloadInterface[]): Promise<EncryptedParameters[]> {
    return Promise.all(payloads.map((payload) => this.encrypPayloadWithKeyLookup(payload)))
  }

  public async encryptPayload(payload: DecryptedPayloadInterface, key: RootKeyInterface): Promise<EncryptedParameters> {
    return encryptPayload(payload, key, this.operatorManager)
  }

  public async encryptPayloads(payloads: DecryptedPayloadInterface[], key: RootKeyInterface) {
    return Promise.all(payloads.map((payload) => this.encryptPayload(payload, key)))
  }

  public async decryptPayloadWithKeyLookup<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    const key = this.getRootKey()

    if (key == undefined) {
      return {
        uuid: payload.uuid,
        errorDecrypting: true,
        waitingForKey: true,
      }
    }

    return this.decryptPayload(payload, key)
  }

  public async decryptPayload<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
    key: RootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    return decryptPayload(payload, key, this.operatorManager)
  }

  public async decryptPayloadsWithKeyLookup<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayloadWithKeyLookup<C>(payload)))
  }

  public async decryptPayloads<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
    key: RootKeyInterface,
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayload<C>(payload, key)))
  }

  /**
   * When the root key changes (non-null only), we must re-encrypt all items
   * keys with this new root key (by simply re-syncing).
   */
  public async reencryptItemsKeys(): Promise<void> {
    const itemsKeys = this.getItemsKeys()

    if (itemsKeys.length > 0) {
      /**
       * Do not call sync after marking dirty.
       * Re-encrypting items keys is called by consumers who have specific flows who
       * will sync on their own timing
       */
      await this.itemManager.setItemsDirty(itemsKeys)
    }
  }

  /**
   * Creates a new random items key to use for item encryption, and adds it to model management.
   * Consumer must call sync. If the protocol version <= 003, only one items key should be created,
   * and its .itemsKey value should be equal to the root key masterKey value.
   */
  public async createNewDefaultItemsKey(): Promise<ItemsKeyInterface> {
    const rootKey = this.getSureRootKey()
    const operatorVersion = rootKey ? rootKey.keyVersion : ProtocolVersionLatest
    let itemTemplate: ItemsKeyInterface

    if (compareVersions(operatorVersion, ProtocolVersionLastNonrootItemsKey) <= 0) {
      /** Create root key based items key */
      const payload = new DecryptedPayload<ItemsKeyContent>({
        uuid: UuidGenerator.GenerateUuid(),
        content_type: ContentType.ItemsKey,
        content: FillItemContentSpecialized<ItemsKeyContentSpecialized, ItemsKeyContent>({
          itemsKey: rootKey.masterKey,
          dataAuthenticationKey: rootKey.dataAuthenticationKey,
          version: operatorVersion,
        }),
        ...PayloadTimestampDefaults(),
      })
      itemTemplate = CreateDecryptedItemFromPayload(payload)
    } else {
      /** Create independent items key */
      itemTemplate = this.operatorManager.operatorForVersion(operatorVersion).createItemsKey()
    }

    const itemsKeys = this.getItemsKeys()
    const defaultKeys = itemsKeys.filter((key) => {
      return key.isDefault
    })

    for (const key of defaultKeys) {
      await this.itemManager.changeItemsKey(key, (mutator) => {
        mutator.isDefault = false
      })
    }

    const itemsKey = (await this.itemManager.insertItem(itemTemplate)) as ItemsKeyInterface

    await this.itemManager.changeItemsKey(itemsKey, (mutator) => {
      mutator.isDefault = true
    })

    return itemsKey
  }

  public async createNewItemsKeyWithRollback(): Promise<() => Promise<void>> {
    const currentDefaultItemsKey = findDefaultItemsKey(this.getItemsKeys())
    const newDefaultItemsKey = await this.createNewDefaultItemsKey()

    const rollback = async () => {
      await this.itemManager.setItemToBeDeleted(newDefaultItemsKey)

      if (currentDefaultItemsKey) {
        await this.itemManager.changeItem<ItemsKeyMutator>(currentDefaultItemsKey, (mutator) => {
          mutator.isDefault = true
        })
      }
    }

    return rollback
  }

  override async getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return {
      rootKeyEncryption: {
        hasRootKey: this.rootKey != undefined,
        keyMode: KeyMode[this.keyMode],
        hasRootKeyWrapper: await this.hasRootKeyWrapper(),
        hasAccount: this.hasAccount(),
        hasRootKeyEncryptionSource: this.hasRootKeyEncryptionSource(),
        hasPasscode: this.hasPasscode(),
        getEncryptionSourceVersion: this.hasRootKeyEncryptionSource() && (await this.getEncryptionSourceVersion()),
        getUserVersion: this.getUserVersion(),
      },
    }
  }
}
