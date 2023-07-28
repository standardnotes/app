import {
  AnyKeyParamsContent,
  ApplicationIdentifier,
  KeyParamsOrigination,
  ProtocolVersion,
  ProtocolVersionLatest,
} from '@standardnotes/common'
import {
  CreateNewRootKey,
  CreateAnyKeyParams,
  SNRootKey,
  isErrorDecryptingParameters,
  EncryptionOperatorsInterface,
} from '@standardnotes/encryption'
import {
  DecryptedPayload,
  DecryptedTransferPayload,
  EncryptedPayload,
  EncryptedTransferPayload,
  FillItemContentSpecialized,
  NamespacedRootKeyInKeychain,
  RootKeyContent,
  RootKeyInterface,
  RootKeyParamsInterface,
} from '@standardnotes/models'
import { DeviceInterface } from '../Device/DeviceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { StorageKey } from '../Storage/StorageKeys'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { StorageValueModes } from '../Storage/StorageTypes'
import { EncryptTypeAPayload } from '../Encryption/UseCase/TypeA/EncryptPayload'
import { DecryptTypeAPayload } from '../Encryption/UseCase/TypeA/DecryptPayload'
import { AbstractService } from '../Service/AbstractService'
import { RootKeyManagerEvent } from './RootKeyManagerEvent'
import { ValidatePasscodeResult } from './ValidatePasscodeResult'
import { ValidateAccountPasswordResult } from './ValidateAccountPasswordResult'
import { KeyMode } from './KeyMode'
import { ReencryptTypeAItems } from '../Encryption/UseCase/TypeA/ReencryptTypeAItems'

export class RootKeyManager extends AbstractService<RootKeyManagerEvent> {
  private rootKey?: RootKeyInterface
  private keyMode = KeyMode.RootKeyNone
  private memoizedRootKeyParams?: RootKeyParamsInterface

  constructor(
    private device: DeviceInterface,
    private storage: StorageServiceInterface,
    private operators: EncryptionOperatorsInterface,
    private identifier: ApplicationIdentifier,
    private _reencryptTypeAItems: ReencryptTypeAItems,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  override deinit() {
    super.deinit()
    ;(this.device as unknown) = undefined
    ;(this.storage as unknown) = undefined
    ;(this.operators as unknown) = undefined
    ;(this.identifier as unknown) = undefined
    ;(this._reencryptTypeAItems as unknown) = undefined

    this.rootKey = undefined
    this.memoizedRootKeyParams = undefined
  }

  public async initialize(): Promise<void> {
    const wrappedRootKey = this.getWrappedRootKey()
    const accountKeyParams = this.recomputeAccountKeyParams()
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

  public getMemoizedRootKeyParams(): RootKeyParamsInterface | undefined {
    return this.memoizedRootKeyParams
  }

  public getKeyMode(): KeyMode {
    return this.keyMode
  }

  public async hasRootKeyWrapper(): Promise<boolean> {
    const wrapper = this.getRootKeyWrapperKeyParams()
    return wrapper != undefined
  }

  public getRootKeyWrapperKeyParams(): RootKeyParamsInterface | undefined {
    const rawKeyParams = this.storage.getValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)

    if (!rawKeyParams) {
      return undefined
    }

    return CreateAnyKeyParams(rawKeyParams as AnyKeyParamsContent)
  }

  public async passcodeUpgradeAvailable(): Promise<boolean> {
    const passcodeParams = this.getRootKeyWrapperKeyParams()
    if (!passcodeParams) {
      return false
    }
    return passcodeParams.version !== ProtocolVersionLatest
  }

  public hasAccount(): boolean {
    switch (this.keyMode) {
      case KeyMode.RootKeyNone:
      case KeyMode.WrapperOnly:
        return false
      case KeyMode.RootKeyOnly:
      case KeyMode.RootKeyPlusWrapper:
        return true
      default:
        throw Error('Unhandled keyMode value.')
    }
  }

  public getUserVersion(): ProtocolVersion | undefined {
    const keyParams = this.memoizedRootKeyParams
    return keyParams?.version
  }

  public hasRootKeyEncryptionSource(): boolean {
    return this.hasAccount() || this.hasPasscode()
  }

  public async computeRootKey<K extends RootKeyInterface>(
    password: string,
    keyParams: RootKeyParamsInterface,
  ): Promise<K> {
    const version = keyParams.version
    const operator = this.operators.operatorForVersion(version)
    return operator.computeRootKey(password, keyParams)
  }

  /**
   * Deletes root key and wrapper from keychain. Used when signing out of application.
   */
  public async deleteWorkspaceSpecificKeyStateFromDevice(): Promise<void> {
    await this.device.clearNamespacedKeychainValue(this.identifier)

    await this.storage.removeValue(StorageKey.WrappedRootKey, StorageValueModes.Nonwrapped)
    await this.storage.removeValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)
    await this.storage.removeValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)

    this.keyMode = KeyMode.RootKeyNone
    this.setRootKeyInstance(undefined)

    await this.handleKeyStatusChange()
  }

  public async createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
    version?: ProtocolVersion,
  ): Promise<K> {
    const operator = version ? this.operators.operatorForVersion(version) : this.operators.defaultOperator()
    return operator.createRootKey(identifier, password, origination)
  }

  public async validateAccountPassword(password: string): Promise<ValidateAccountPasswordResult> {
    const key = await this.computeRootKey(password, this.memoizedRootKeyParams as RootKeyParamsInterface)
    const valid = this.getSureRootKey().compare(key)
    if (valid) {
      return { valid, artifacts: { rootKey: key } }
    } else {
      return { valid: false }
    }
  }

  public async validatePasscode(passcode: string): Promise<ValidatePasscodeResult> {
    const keyParams = this.getSureRootKeyWrapperKeyParams()
    const key = await this.computeRootKey(passcode, keyParams)
    const valid = await this.validateWrappingKey(key)
    if (valid) {
      return { valid, artifacts: { wrappingKey: key } }
    } else {
      return { valid: false }
    }
  }

  public async getEncryptionSourceVersion(): Promise<ProtocolVersion> {
    if (this.hasAccount()) {
      return this.getSureUserVersion()
    } else if (this.hasPasscode()) {
      const passcodeParams = this.getSureRootKeyWrapperKeyParams()
      return passcodeParams.version
    }

    throw Error('Attempting to access encryption source version without source')
  }

  public getSureUserVersion(): ProtocolVersion {
    const keyParams = this.memoizedRootKeyParams as RootKeyParamsInterface
    return keyParams.version
  }

  private async handleKeyStatusChange(): Promise<void> {
    this.recomputeAccountKeyParams()
    void this.notifyEvent(RootKeyManagerEvent.RootKeyManagerKeyStatusChanged)
  }

  public hasPasscode(): boolean {
    return this.keyMode === KeyMode.WrapperOnly || this.keyMode === KeyMode.RootKeyPlusWrapper
  }

  public recomputeAccountKeyParams(): RootKeyParamsInterface | undefined {
    const rawKeyParams = this.storage.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)

    if (!rawKeyParams) {
      return
    }

    this.memoizedRootKeyParams = CreateAnyKeyParams(rawKeyParams as AnyKeyParamsContent)
    return this.memoizedRootKeyParams
  }

  public getSureRootKeyWrapperKeyParams() {
    return this.getRootKeyWrapperKeyParams() as RootKeyParamsInterface
  }

  /**
   * Wraps the current in-memory root key value using the wrappingKey,
   * then persists the wrapped value to disk.
   */
  public async wrapAndPersistRootKey(wrappingKey: RootKeyInterface): Promise<void> {
    const rootKey = this.getSureRootKey()

    const value: DecryptedTransferPayload = {
      ...rootKey.payload.ejected(),
      content: FillItemContentSpecialized(rootKey.persistableValueWhenWrapping()),
    }

    const payload = new DecryptedPayload(value)

    const usecase = new EncryptTypeAPayload(this.operators)
    const wrappedKey = await usecase.executeOne(payload, wrappingKey)
    const wrappedKeyPayload = new EncryptedPayload({
      ...payload.ejected(),
      ...wrappedKey,
      errorDecrypting: false,
      waitingForKey: false,
    })

    this.storage.setValue(StorageKey.WrappedRootKey, wrappedKeyPayload.ejected(), StorageValueModes.Nonwrapped)
  }

  public async unwrapRootKey(wrappingKey: RootKeyInterface): Promise<void> {
    if (this.keyMode === KeyMode.WrapperOnly) {
      this.setRootKeyInstance(wrappingKey)
      return
    }

    if (this.keyMode !== KeyMode.RootKeyPlusWrapper) {
      throw 'Invalid key mode condition for unwrapping.'
    }

    const wrappedKey = this.getWrappedRootKey()
    const payload = new EncryptedPayload(wrappedKey)
    const usecase = new DecryptTypeAPayload(this.operators)
    const decrypted = await usecase.executeOne<RootKeyContent>(payload, wrappingKey)

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
  public async setNewRootKeyWrapper(wrappingKey: RootKeyInterface) {
    if (this.keyMode === KeyMode.RootKeyNone) {
      this.keyMode = KeyMode.WrapperOnly
    } else if (this.keyMode === KeyMode.RootKeyOnly) {
      this.keyMode = KeyMode.RootKeyPlusWrapper
    } else {
      throw Error('Attempting to set wrapper on already wrapped key.')
    }

    await this.device.clearNamespacedKeychainValue(this.identifier)

    if (this.keyMode === KeyMode.WrapperOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      if (this.keyMode === KeyMode.WrapperOnly) {
        this.setRootKeyInstance(wrappingKey)
        await this._reencryptTypeAItems.execute()
      } else {
        await this.wrapAndPersistRootKey(wrappingKey)
      }

      this.storage.setValue(
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

    await this.storage.removeValue(StorageKey.WrappedRootKey, StorageValueModes.Nonwrapped)
    await this.storage.removeValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)

    if (this.keyMode === KeyMode.RootKeyOnly) {
      await this.saveRootKeyToKeychain()
    }

    await this.handleKeyStatusChange()
  }

  public async setRootKey(key: RootKeyInterface, wrappingKey?: RootKeyInterface) {
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
      throw Error('Unhandled key mode for setNewRootKey')
    }

    this.setRootKeyInstance(key)

    this.storage.setValue(StorageKey.RootKeyParams, key.keyParams.getPortableValue(), StorageValueModes.Nonwrapped)

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

  public getRootKeyParams(): RootKeyParamsInterface | undefined {
    if (this.keyMode === KeyMode.WrapperOnly) {
      return this.getRootKeyWrapperKeyParams()
    } else if (this.keyMode === KeyMode.RootKeyOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      return this.recomputeAccountKeyParams()
    } else if (this.keyMode === KeyMode.RootKeyNone) {
      return undefined
    } else {
      throw 'Unhandled key mode for getRootKeyParams'
    }
  }

  public getSureRootKeyParams(): RootKeyParamsInterface {
    return this.getRootKeyParams() as RootKeyParamsInterface
  }

  public async saveRootKeyToKeychain() {
    if (this.getRootKey() == undefined) {
      throw 'Attempting to non-existent root key to the keychain.'
    }
    if (this.keyMode !== KeyMode.RootKeyOnly) {
      throw 'Should not be persisting wrapped key to keychain.'
    }

    const rawKey = this.getSureRootKey().getKeychainValue()

    return this.executeCriticalFunction(() => {
      return this.device.setNamespacedKeychainValue(rawKey, this.identifier)
    })
  }

  /**
   * We know a wrappingKey is correct if it correctly decrypts
   * wrapped root key.
   */
  public async validateWrappingKey(wrappingKey: RootKeyInterface): Promise<boolean> {
    const wrappedRootKey = this.getWrappedRootKey()

    /** If wrapper only, storage is encrypted directly with wrappingKey */
    if (this.keyMode === KeyMode.WrapperOnly) {
      return this.storage.canDecryptWithKey(wrappingKey)
    } else if (this.keyMode === KeyMode.RootKeyOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      /**
       * In these modes, storage is encrypted with account keys, and
       * account keys are encrypted with wrappingKey. Here we validate
       * by attempting to decrypt account keys.
       */
      const wrappedKeyPayload = new EncryptedPayload(wrappedRootKey)
      const usecase = new DecryptTypeAPayload(this.operators)
      const decrypted = await usecase.executeOne(wrappedKeyPayload, wrappingKey)
      return !isErrorDecryptingParameters(decrypted)
    } else {
      throw 'Unhandled case in validateWrappingKey'
    }
  }

  private getWrappedRootKey(): EncryptedTransferPayload {
    return this.storage.getValue<EncryptedTransferPayload>(StorageKey.WrappedRootKey, StorageValueModes.Nonwrapped)
  }

  public setRootKeyInstance(rootKey: RootKeyInterface | undefined): void {
    this.rootKey = rootKey
  }

  public getRootKey(): RootKeyInterface | undefined {
    return this.rootKey
  }

  public getSureRootKey(): RootKeyInterface {
    return this.rootKey as RootKeyInterface
  }

  public async getRootKeyFromKeychain(): Promise<RootKeyInterface | undefined> {
    const rawKey = (await this.device.getNamespacedKeychainValue(this.identifier)) as
      | NamespacedRootKeyInKeychain
      | undefined

    if (rawKey == undefined) {
      return undefined
    }

    const keyParams = this.getSureRootKeyParams()

    return CreateNewRootKey({
      ...rawKey,
      keyParams: keyParams.getPortableValue(),
    })
  }
}
