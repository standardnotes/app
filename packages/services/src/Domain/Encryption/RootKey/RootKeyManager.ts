import { AnyKeyParamsContent, ApplicationIdentifier } from '@standardnotes/common'
import {
  KeyMode,
  SNRootKeyParams,
  CreateNewRootKey,
  CreateAnyKeyParams,
  SNRootKey,
  isErrorDecryptingParameters,
  OperatorManager,
} from '@standardnotes/encryption'
import {
  ContentTypesUsingRootKeyEncryption,
  DecryptedPayload,
  DecryptedTransferPayload,
  EncryptedPayload,
  EncryptedTransferPayload,
  FillItemContentSpecialized,
  NamespacedRootKeyInKeychain,
  RootKeyContent,
  RootKeyInterface,
} from '@standardnotes/models'
import { DeviceInterface } from '../../Device/DeviceInterface'
import { InternalEventBusInterface } from '../../Internal/InternalEventBusInterface'
import { StorageKey } from '../../Storage/StorageKeys'
import { StorageServiceInterface } from '../../Storage/StorageServiceInterface'
import { StorageValueModes } from '../../Storage/StorageTypes'
import { RootKeyEncryptPayloadUseCase } from './UseCase/EncryptPayload'
import { RootKeyDecryptPayloadUseCase } from './UseCase/DecryptPayload'
import { AbstractService } from '../../Service/AbstractService'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'

export enum RootKeyManagerEvent {
  RootKeyStatusChanged = 'RootKeyStatusChanged',
}

export class RootKeyManager extends AbstractService<RootKeyManagerEvent> {
  private rootKey?: RootKeyInterface

  public keyMode = KeyMode.RootKeyNone
  public memoizedRootKeyParams?: SNRootKeyParams

  constructor(
    private device: DeviceInterface,
    private storage: StorageServiceInterface,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private operatorManager: OperatorManager,
    private identifier: ApplicationIdentifier,
    private eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)
  }

  override deinit() {
    super.deinit()
    this.rootKey = undefined
    this.memoizedRootKeyParams = undefined
  }

  public async initialize() {
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

  public async hasRootKeyWrapper() {
    const wrapper = this.getRootKeyWrapperKeyParams()
    return wrapper != undefined
  }

  public getRootKeyWrapperKeyParams(): SNRootKeyParams | undefined {
    const rawKeyParams = this.storage.getValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)

    if (!rawKeyParams) {
      return undefined
    }

    return CreateAnyKeyParams(rawKeyParams as AnyKeyParamsContent)
  }

  private async handleKeyStatusChange() {
    this.recomputeAccountKeyParams()
    void this.eventBus.publish({ type: RootKeyManagerEvent.RootKeyStatusChanged, payload: undefined })
  }

  public recomputeAccountKeyParams(): SNRootKeyParams | undefined {
    const rawKeyParams = this.storage.getValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)

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
  public async wrapAndPersistRootKey(wrappingKey: SNRootKey) {
    const rootKey = this.getSureRootKey()

    const value: DecryptedTransferPayload = {
      ...rootKey.payload.ejected(),
      content: FillItemContentSpecialized(rootKey.persistableValueWhenWrapping()),
    }

    const payload = new DecryptedPayload(value)

    const usecase = new RootKeyEncryptPayloadUseCase(this.operatorManager)
    const wrappedKey = await usecase.execute(payload, wrappingKey)
    const wrappedKeyPayload = new EncryptedPayload({
      ...payload.ejected(),
      ...wrappedKey,
      errorDecrypting: false,
      waitingForKey: false,
    })

    this.storage.setValue(StorageKey.WrappedRootKey, wrappedKeyPayload.ejected(), StorageValueModes.Nonwrapped)
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
    const usecase = new RootKeyDecryptPayloadUseCase(this.operatorManager)
    const decrypted = await usecase.execute<RootKeyContent>(payload, wrappingKey)

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

    await this.device.clearNamespacedKeychainValue(this.identifier)

    if (this.keyMode === KeyMode.WrapperOnly || this.keyMode === KeyMode.RootKeyPlusWrapper) {
      if (this.keyMode === KeyMode.WrapperOnly) {
        this.setRootKeyInstance(wrappingKey)
        await this.reencryptApplicableItemsAfterUserRootKeyChange()
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
   * When the root key changes, we must re-encrypt all relevant items with this new root key (by simply re-syncing).
   */
  public async reencryptApplicableItemsAfterUserRootKeyChange(): Promise<void> {
    const items = this.items.getItems(ContentTypesUsingRootKeyEncryption())
    if (items.length > 0) {
      /**
       * Do not call sync after marking dirty.
       * Re-encrypting items keys is called by consumers who have specific flows who
       * will sync on their own timing
       */
      await this.mutator.setItemsDirty(items)
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

  public getRootKeyParams(): SNRootKeyParams | undefined {
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

  public getSureRootKeyParams(): SNRootKeyParams {
    return this.getRootKeyParams() as SNRootKeyParams
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
  public async validateWrappingKey(wrappingKey: SNRootKey) {
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
      const usecase = new RootKeyDecryptPayloadUseCase(this.operatorManager)
      const decrypted = await usecase.execute(wrappedKeyPayload, wrappingKey)
      return !isErrorDecryptingParameters(decrypted)
    } else {
      throw 'Unhandled case in validateWrappingKey'
    }
  }

  public getWrappedRootKey() {
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

  public async getRootKeyFromKeychain() {
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
