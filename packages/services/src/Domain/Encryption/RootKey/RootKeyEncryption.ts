import { InternalEventHandlerInterface } from '../../Internal/InternalEventHandlerInterface'
import { MutatorClientInterface } from '../../Mutator/MutatorClientInterface'
import {
  ApplicationIdentifier,
  ProtocolVersionLatest,
  ProtocolVersion,
  KeyParamsOrigination,
} from '@standardnotes/common'
import {
  RootKeyServiceEvent,
  KeyMode,
  SNRootKeyParams,
  OperatorManager,
  SNRootKey,
  isErrorDecryptingParameters,
  ErrorDecryptingParameters,
  findDefaultItemsKey,
  ItemsKeyMutator,
  EncryptedOutputParameters,
  DecryptedParameters,
  KeySystemKeyManagerInterface,
} from '@standardnotes/encryption'
import {
  ContentTypeUsesKeySystemRootKeyEncryption,
  ContentTypeUsesRootKeyEncryption,
  DecryptedPayload,
  DecryptedPayloadInterface,
  EncryptedPayload,
  EncryptedPayloadInterface,
  KeySystemRootKeyInterface,
  ItemContent,
  ItemsKeyInterface,
  PayloadEmitSource,
  RootKeyInterface,
  SureFindPayload,
  KeySystemIdentifier,
  RootKeyParamsInterface,
} from '@standardnotes/models'
import { DeviceInterface } from '../../Device/DeviceInterface'
import { InternalEventBusInterface } from '../../Internal/InternalEventBusInterface'
import { ItemManagerInterface } from '../../Item/ItemManagerInterface'
import { AbstractService } from '../../Service/AbstractService'
import { StorageKey } from '../../Storage/StorageKeys'
import { StorageServiceInterface } from '../../Storage/StorageServiceInterface'
import { StorageValueModes } from '../../Storage/StorageTypes'
import { PayloadManagerInterface } from '../../Payloads/PayloadManagerInterface'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { RootKeyManager, RootKeyManagerEvent } from './RootKeyManager'
import { InternalEventInterface } from '@standardnotes/snjs'
import { RootKeyEncryptPayloadUseCase } from './UseCase/EncryptPayload'
import { RootKeyEncryptPayloadWithKeyLookupUseCase } from './UseCase/EncryptPayloadWithKeyLookup'
import { RootKeyDecryptPayloadUseCase } from './UseCase/DecryptPayload'
import { RootKeyDecryptPayloadWithKeyLookupUseCase } from './UseCase/DecryptPayloadWithKeyLookup'
import { CreateNewDefaultItemsKeyUseCase } from './UseCase/CreateNewDefaultItemsKey'

export class RootKeyEncryptionService
  extends AbstractService<RootKeyServiceEvent>
  implements InternalEventHandlerInterface
{
  private rootKeyManager: RootKeyManager

  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private operatorManager: OperatorManager,
    public deviceInterface: DeviceInterface,
    private storageService: StorageServiceInterface,
    private payloadManager: PayloadManagerInterface,
    private keys: KeySystemKeyManagerInterface,
    private identifier: ApplicationIdentifier,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.rootKeyManager = new RootKeyManager(
      deviceInterface,
      storageService,
      items,
      mutator,
      operatorManager,
      identifier,
      internalEventBus,
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === RootKeyManagerEvent.RootKeyStatusChanged) {
      void this.notifyEvent(RootKeyServiceEvent.RootKeyStatusChanged)
    }
  }

  public override async blockDeinit(): Promise<void> {
    await this.rootKeyManager.blockDeinit()
    return super.blockDeinit()
  }

  public override deinit(): void {
    ;(this.items as unknown) = undefined
    ;(this.operatorManager as unknown) = undefined
    ;(this.deviceInterface as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.keys as unknown) = undefined

    this.rootKeyManager.deinit()
    super.deinit()
  }

  public async initialize() {
    await this.rootKeyManager.initialize()
  }

  public async passcodeUpgradeAvailable() {
    const passcodeParams = this.getRootKeyWrapperKeyParams()
    if (!passcodeParams) {
      return false
    }
    return passcodeParams.version !== ProtocolVersionLatest
  }

  public async hasRootKeyWrapper() {
    return this.rootKeyManager.hasRootKeyWrapper()
  }

  public getRootKey(): RootKeyInterface | undefined {
    return this.rootKeyManager.getRootKey()
  }

  public getMemoizedRootKeyParams(): RootKeyParamsInterface | undefined {
    return this.rootKeyManager.memoizedRootKeyParams
  }

  public getKeyMode(): KeyMode {
    return this.rootKeyManager.keyMode
  }

  public hasAccount() {
    switch (this.rootKeyManager.keyMode) {
      case KeyMode.RootKeyNone:
      case KeyMode.WrapperOnly:
        return false
      case KeyMode.RootKeyOnly:
      case KeyMode.RootKeyPlusWrapper:
        return true
      default:
        throw Error(`Unhandled keyMode value '${this.rootKeyManager.keyMode}'.`)
    }
  }

  public hasRootKeyEncryptionSource(): boolean {
    return this.hasAccount() || this.hasPasscode()
  }

  public hasPasscode() {
    return (
      this.rootKeyManager.keyMode === KeyMode.WrapperOnly || this.rootKeyManager.keyMode === KeyMode.RootKeyPlusWrapper
    )
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

  public getUserVersion(): ProtocolVersion | undefined {
    const keyParams = this.rootKeyManager.memoizedRootKeyParams
    return keyParams?.version
  }

  private getSureUserVersion(): ProtocolVersion {
    const keyParams = this.rootKeyManager.memoizedRootKeyParams as SNRootKeyParams
    return keyParams.version
  }

  public getRootKeyWrapperKeyParams(): SNRootKeyParams | undefined {
    return this.rootKeyManager.getRootKeyWrapperKeyParams()
  }

  public getSureRootKeyWrapperKeyParams() {
    return this.getRootKeyWrapperKeyParams() as SNRootKeyParams
  }

  public getRootKeyParams(): SNRootKeyParams | undefined {
    return this.rootKeyManager.getRootKeyParams()
  }

  public getSureRootKeyParams(): SNRootKeyParams {
    return this.rootKeyManager.getSureRootKeyParams()
  }

  public async computeRootKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
    const version = keyParams.version
    const operator = this.operatorManager.operatorForVersion(version)
    return operator.computeRootKey(password, keyParams)
  }

  public async createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
    version?: ProtocolVersion,
  ): Promise<K> {
    const operator = version ? this.operatorManager.operatorForVersion(version) : this.operatorManager.defaultOperator()
    return operator.createRootKey(identifier, password, origination)
  }

  public async validateAccountPassword(password: string) {
    const key = await this.computeRootKey(password, this.rootKeyManager.memoizedRootKeyParams as SNRootKeyParams)
    const valid = this.rootKeyManager.getSureRootKey().compare(key)
    if (valid) {
      return { valid, artifacts: { rootKey: key } }
    } else {
      return { valid: false }
    }
  }

  public async validatePasscode(passcode: string) {
    const keyParams = this.getSureRootKeyWrapperKeyParams()
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
    return this.rootKeyManager.validateWrappingKey(wrappingKey)
  }

  public async unwrapRootKey(wrappingKey: RootKeyInterface) {
    return this.rootKeyManager.unwrapRootKey(wrappingKey)
  }

  /**
   * Encrypts rootKey and saves it in storage instead of keychain, and then
   * clears keychain. This is because we don't want to store large encrypted
   * payloads in the keychain. If the root key is not wrapped, it is stored
   * in plain form in the user's secure keychain.
   */
  public async setNewRootKeyWrapper(wrappingKey: SNRootKey) {
    return this.rootKeyManager.setNewRootKeyWrapper(wrappingKey)
  }

  /**
   * Removes root key wrapper from local storage and stores root key bare in secure keychain.
   */
  public async removeRootKeyWrapper(): Promise<void> {
    return this.rootKeyManager.removeRootKeyWrapper()
  }

  public async setRootKey(key: SNRootKey, wrappingKey?: SNRootKey) {
    return this.rootKeyManager.setRootKey(key, wrappingKey)
  }

  /**
   * Deletes root key and wrapper from keychain. Used when signing out of application.
   */
  public async deleteWorkspaceSpecificKeyStateFromDevice() {
    await this.deviceInterface.clearNamespacedKeychainValue(this.identifier)
    await this.storageService.removeValue(StorageKey.WrappedRootKey, StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(StorageKey.RootKeyWrapperKeyParams, StorageValueModes.Nonwrapped)
    await this.storageService.removeValue(StorageKey.RootKeyParams, StorageValueModes.Nonwrapped)
    this.rootKeyManager.keyMode = KeyMode.RootKeyNone
    this.rootKeyManager.setRootKeyInstance(undefined)

    await this.notifyEvent(RootKeyServiceEvent.RootKeyStatusChanged)
  }

  private getItemsKeys() {
    return this.items.getDisplayableItemsKeys()
  }

  public async decryptErroredRootPayloads(): Promise<void> {
    const erroredRootPayloads = this.payloadManager.invalidPayloads.filter(
      (i) =>
        ContentTypeUsesRootKeyEncryption(i.content_type) || ContentTypeUsesKeySystemRootKeyEncryption(i.content_type),
    )
    if (erroredRootPayloads.length === 0) {
      return
    }

    const resultParams = await this.decryptPayloadsWithKeyLookup(erroredRootPayloads)

    const decryptedPayloads = resultParams.map((params) => {
      const original = SureFindPayload(erroredRootPayloads, params.uuid)
      if (isErrorDecryptingParameters(params)) {
        return new EncryptedPayload({
          ...original.ejected(),
          ...params,
        })
      } else {
        return new DecryptedPayload({
          ...original.ejected(),
          ...params,
        })
      }
    })

    await this.payloadManager.emitPayloads(decryptedPayloads, PayloadEmitSource.LocalChanged)
  }

  public async reencryptApplicableItemsAfterUserRootKeyChange(): Promise<void> {
    return this.rootKeyManager.reencryptApplicableItemsAfterUserRootKeyChange()
  }

  /**
   * When the key system root key changes, we must re-encrypt all vault items keys
   * with this new key system root key (by simply re-syncing).
   */
  public async reencryptKeySystemItemsKeysForVault(keySystemIdentifier: KeySystemIdentifier): Promise<void> {
    const keySystemItemsKeys = this.keys.getKeySystemItemsKeys(keySystemIdentifier)
    if (keySystemItemsKeys.length > 0) {
      await this.mutator.setItemsDirty(keySystemItemsKeys)
    }
  }

  public async createNewDefaultItemsKey(): Promise<ItemsKeyInterface> {
    const usecase = new CreateNewDefaultItemsKeyUseCase(
      this.mutator,
      this.items,
      this.operatorManager,
      this.rootKeyManager,
    )
    return usecase.execute()
  }

  public async createNewItemsKeyWithRollback(): Promise<() => Promise<void>> {
    const currentDefaultItemsKey = findDefaultItemsKey(this.getItemsKeys())
    const newDefaultItemsKey = await this.createNewDefaultItemsKey()

    const rollback = async () => {
      await this.mutator.setItemToBeDeleted(newDefaultItemsKey)

      if (currentDefaultItemsKey) {
        await this.mutator.changeItem<ItemsKeyMutator>(currentDefaultItemsKey, (mutator) => {
          mutator.isDefault = true
        })
      }
    }

    return rollback
  }

  private async encryptPayloadWithKeyLookup(
    payload: DecryptedPayloadInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    const usecase = new RootKeyEncryptPayloadWithKeyLookupUseCase(this.operatorManager, this.keys, this.rootKeyManager)
    return usecase.execute(payload, signingKeyPair)
  }

  public async encryptPayloadsWithKeyLookup(
    payloads: DecryptedPayloadInterface[],
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters[]> {
    return Promise.all(payloads.map((payload) => this.encryptPayloadWithKeyLookup(payload, signingKeyPair)))
  }

  public async encryptPayload(
    payload: DecryptedPayloadInterface,
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ): Promise<EncryptedOutputParameters> {
    const usecase = new RootKeyEncryptPayloadUseCase(this.operatorManager)
    return usecase.execute(payload, key, signingKeyPair)
  }

  public async encryptPayloads(
    payloads: DecryptedPayloadInterface[],
    key: RootKeyInterface | KeySystemRootKeyInterface,
    signingKeyPair?: PkcKeyPair,
  ) {
    return Promise.all(payloads.map((payload) => this.encryptPayload(payload, key, signingKeyPair)))
  }

  public async decryptPayloadWithKeyLookup<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    const usecase = new RootKeyDecryptPayloadWithKeyLookupUseCase(this.operatorManager, this.keys, this.rootKeyManager)
    return usecase.execute(payload)
  }

  public async decryptPayload<C extends ItemContent = ItemContent>(
    payload: EncryptedPayloadInterface,
    key: RootKeyInterface | KeySystemRootKeyInterface,
  ): Promise<DecryptedParameters<C> | ErrorDecryptingParameters> {
    const usecase = new RootKeyDecryptPayloadUseCase(this.operatorManager)
    return usecase.execute(payload, key)
  }

  public async decryptPayloadsWithKeyLookup<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayloadWithKeyLookup<C>(payload)))
  }

  public async decryptPayloads<C extends ItemContent = ItemContent>(
    payloads: EncryptedPayloadInterface[],
    key: RootKeyInterface | KeySystemRootKeyInterface,
  ): Promise<(DecryptedParameters<C> | ErrorDecryptingParameters)[]> {
    return Promise.all(payloads.map((payload) => this.decryptPayload<C>(payload, key)))
  }
}
