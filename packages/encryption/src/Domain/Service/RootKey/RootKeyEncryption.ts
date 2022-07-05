import * as Common from '@standardnotes/common'
import * as Models from '@standardnotes/models'
import {
  DecryptedPayload,
  FillItemContentSpecialized,
  ItemsKeyContent,
  ItemsKeyContentSpecialized,
  NamespacedRootKeyInKeychain,
  PayloadTimestampDefaults,
  RootKeyContent,
  RootKeyInterface,
} from '@standardnotes/models'
import * as Services from '@standardnotes/services'
import { UuidGenerator } from '@standardnotes/utils'
import { ItemsKeyMutator } from '../../Keys/ItemsKey/ItemsKeyMutator'
import { CreateNewRootKey } from '../../Keys/RootKey/Functions'
import { CreateAnyKeyParams } from '../../Keys/RootKey/KeyParamsFunctions'
import { SNRootKey } from '../../Keys/RootKey/RootKey'
import { SNRootKeyParams } from '../../Keys/RootKey/RootKeyParams'
import { OperatorManager } from '../../Operator/OperatorManager'
import * as OperatorWrapper from '../../Operator/OperatorWrapper'
import {
  DecryptedParameters,
  EncryptedParameters,
  ErrorDecryptingParameters,
  isErrorDecryptingParameters,
} from '../../Types/EncryptedParameters'
import { findDefaultItemsKey } from '../Functions'
import { KeyMode } from './KeyMode'

export enum RootKeyServiceEvent {
  RootKeyStatusChanged = 'RootKeyStatusChanged',
}

export class RootKeyEncryptionService extends Services.AbstractService<RootKeyServiceEvent> {
  private rootKey?: RootKeyInterface
  public keyMode = KeyMode.RootKeyNone
  public memoizedRootKeyParams?: SNRootKeyParams

  constructor(
    private itemManager: Services.ItemManagerInterface,
    private operatorManager: OperatorManager,
    public deviceInterface: Services.DeviceInterface,
    private storageService: Services.StorageServiceInterface,
    private identifier: Common.ApplicationIdentifier,
    protected override internalEventBus: Services.InternalEventBusInterface,
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
    return passcodeParams.version !== Common.ProtocolVersionLatest
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

  public async getEncryptionSourceVersion(): Promise<Common.ProtocolVersion> {
    if (this.hasAccount()) {
      return this.getSureUserVersion()
    } else if (this.hasPasscode()) {
      const passcodeParams = await this.getSureRootKeyWrapperKeyParams()
      return passcodeParams.version
    }

    throw Error('Attempting to access encryption source version without source')
  }

  public getUserVersion(): Common.ProtocolVersion | undefined {
    const keyParams = this.memoizedRootKeyParams
    return keyParams?.version
  }

  private getSureUserVersion(): Common.ProtocolVersion {
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
      Services.StorageKey.RootKeyWrapperKeyParams,
      Services.StorageValueModes.Nonwrapped,
    )

    if (!rawKeyParams) {
      return undefined
    }

    return CreateAnyKeyParams(rawKeyParams as Common.AnyKeyParamsContent)
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
    origination: Common.KeyParamsOrigination,
    version?: Common.ProtocolVersion,
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
      const wrappedKeyPayload = new Models.EncryptedPayload(wrappedRootKey)
      const decrypted = await this.decryptPayload(wrappedKeyPayload, wrappingKey)
      return !isErrorDecryptingParameters(decrypted)
    } else {
      throw 'Unhandled case in validateWrappingKey'
    }
  }

  private async recomputeAccountKeyParams(): Promise<SNRootKeyParams | undefined> {
    const rawKeyParams = await this.storageService.getValue(
      Services.StorageKey.RootKeyParams,
      Services.StorageValueModes.Nonwrapped,
    )

    if (!rawKeyParams) {
      return
    }

    this.memoizedRootKeyParams = CreateAnyKeyParams(rawKeyParams as Common.AnyKeyParamsContent)
    return this.memoizedRootKeyParams
  }

  /**
   * Wraps the current in-memory root key value using the wrappingKey,
   * then persists the wrapped value to disk.
   */
  private async wrapAndPersistRootKey(wrappingKey: SNRootKey) {
    const rootKey = this.getSureRootKey()
    const value: Models.DecryptedTransferPayload = {
      ...rootKey.payload.ejected(),
      content: FillItemContentSpecialized(rootKey.persistableValueWhenWrapping()),
    }
    const payload = new Models.DecryptedPayload(value)

    const wrappedKey = await this.encryptPayload(payload, wrappingKey)
    const wrappedKeyPayload = new Models.EncryptedPayload({
      ...payload.ejected(),
      ...wrappedKey,
      errorDecrypting: false,
      waitingForKey: false,
    })

    this.storageService.setValue(
      Services.StorageKey.WrappedRootKey,
      wrappedKeyPayload.ejected(),
      Services.StorageValueModes.Nonwrapped,
    )
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
    const payload = new Models.EncryptedPayload(wrappedKey)
    const decrypted = await this.decryptPayload<Models.RootKeyContent>(payload, wrappingKey)

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
        Services.StorageKey.RootKeyWrapperKeyParams,
        wrappingKey.keyParams.getPortableValue(),
        Services.StorageValueModes.Nonwrapped,
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

    await this.storageService.removeValue(Services.StorageKey.WrappedRootKey, Services.StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(
      Services.StorageKey.RootKeyWrapperKeyParams,
      Services.StorageValueModes.Nonwrapped,
    )

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
      Services.StorageKey.RootKeyParams,
      key.keyParams.getPortableValue(),
      Services.StorageValueModes.Nonwrapped,
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
    await this.storageService.removeValue(Services.StorageKey.WrappedRootKey, Services.StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(
      Services.StorageKey.RootKeyWrapperKeyParams,
      Services.StorageValueModes.Nonwrapped,
    )
    await this.storageService.removeValue(Services.StorageKey.RootKeyParams, Services.StorageValueModes.Nonwrapped)
    this.keyMode = KeyMode.RootKeyNone
    this.setRootKeyInstance(undefined)

    await this.handleKeyStatusChange()
  }

  private getWrappedRootKey() {
    return this.storageService.getValue<Models.EncryptedTransferPayload>(
      Services.StorageKey.WrappedRootKey,
      Services.StorageValueModes.Nonwrapped,
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

  public async encrypPayloadWithKeyLookup(payload: Models.DecryptedPayloadInterface): Promise<EncryptedParameters> {
    const key = this.getRootKey()

    if (key == undefined) {
      throw Error('Attempting root key encryption with no root key')
    }

    return this.encryptPayload(payload, key)
  }

  public async encryptPayloadsWithKeyLookup(
    payloads: Models.DecryptedPayloadInterface[],
  ): Promise<EncryptedParameters[]> {
    return Promise.all(payloads.map((payload) => this.encrypPayloadWithKeyLookup(payload)))
  }

  public async encryptPayload(
    payload: Models.DecryptedPayloadInterface,
    key: RootKeyInterface,
  ): Promise<EncryptedParameters> {
    return OperatorWrapper.encryptPayload(payload, key, this.operatorManager)
  }

  public async encryptPayloads(payloads: Models.DecryptedPayloadInterface[], key: RootKeyInterface) {
    return Promise.all(payloads.map((payload) => this.encryptPayload(payload, key)))
  }

  public async decryptPayloadWithKeyLookup<C extends Models.ItemContent = Models.ItemContent>(
    payload: Models.EncryptedPayloadInterface,
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

  public async decryptPayload<C extends Models.ItemContent = Models.ItemContent>(
    payload: Models.EncryptedPayloadInterface,
    key: RootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    return OperatorWrapper.decryptPayload(payload, key, this.operatorManager)
  }

  public async decryptPayloadsWithKeyLookup<C extends Models.ItemContent = Models.ItemContent>(
    payloads: Models.EncryptedPayloadInterface[],
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayloadWithKeyLookup<C>(payload)))
  }

  public async decryptPayloads<C extends Models.ItemContent = Models.ItemContent>(
    payloads: Models.EncryptedPayloadInterface[],
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
  public async createNewDefaultItemsKey(): Promise<Models.ItemsKeyInterface> {
    const rootKey = this.getSureRootKey()
    const operatorVersion = rootKey ? rootKey.keyVersion : Common.ProtocolVersionLatest
    let itemTemplate: Models.ItemsKeyInterface

    if (Common.compareVersions(operatorVersion, Common.ProtocolVersionLastNonrootItemsKey) <= 0) {
      /** Create root key based items key */
      const payload = new DecryptedPayload<ItemsKeyContent>({
        uuid: UuidGenerator.GenerateUuid(),
        content_type: Common.ContentType.ItemsKey,
        content: Models.FillItemContentSpecialized<ItemsKeyContentSpecialized, ItemsKeyContent>({
          itemsKey: rootKey.masterKey,
          dataAuthenticationKey: rootKey.dataAuthenticationKey,
          version: operatorVersion,
        }),
        ...PayloadTimestampDefaults(),
      })
      itemTemplate = Models.CreateDecryptedItemFromPayload(payload)
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

    const itemsKey = (await this.itemManager.insertItem(itemTemplate)) as Models.ItemsKeyInterface

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

  override async getDiagnostics(): Promise<Services.DiagnosticInfo | undefined> {
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
