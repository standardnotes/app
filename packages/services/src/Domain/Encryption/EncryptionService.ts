import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import {
  CreateAnyKeyParams,
  CreateEncryptionSplitWithKeyLookup,
  encryptedInputParametersFromPayload,
  EncryptionProviderInterface,
  ErrorDecryptingParameters,
  findDefaultItemsKey,
  FindPayloadInDecryptionSplit,
  FindPayloadInEncryptionSplit,
  isErrorDecryptingParameters,
  ItemAuthenticatedData,
  KeyedDecryptionSplit,
  KeyedEncryptionSplit,
  KeyMode,
  LegacyAttachedData,
  OperatorManager,
  RootKeyEncryptedAuthenticatedData,
  RootKeyServiceEvent,
  SNRootKey,
  SNRootKeyParams,
  SplitPayloadsByEncryptionType,
  V001Algorithm,
  V002Algorithm,
  PublicKeySet,
  EncryptedOutputParameters,
  KeySystemKeyManagerInterface,
  AsymmetricSignatureVerificationDetachedResult,
  AsymmetricallyEncryptedString,
} from '@standardnotes/encryption'
import {
  BackupFile,
  CreateDecryptedBackupFileContextPayload,
  CreateEncryptedBackupFileContextPayload,
  DecryptedPayload,
  DecryptedPayloadInterface,
  EncryptedPayload,
  EncryptedPayloadInterface,
  isDecryptedPayload,
  isEncryptedPayload,
  ItemContent,
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemIdentifier,
  AsymmetricMessagePayload,
  KeySystemRootKeyInterface,
  KeySystemRootKeyParamsInterface,
  TrustedContactInterface,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { PkcKeyPair, PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  extendArray,
  isNotUndefined,
  isNullOrUndefined,
  isReactNativeEnvironment,
  isWebCryptoAvailable,
  UuidGenerator,
} from '@standardnotes/utils'
import {
  AnyKeyParamsContent,
  ApplicationIdentifier,
  compareVersions,
  ContentType,
  isVersionLessThanOrEqualTo,
  KeyParamsOrigination,
  ProtocolVersion,
  ProtocolVersionLastNonrootItemsKey,
  ProtocolVersionLatest,
} from '@standardnotes/common'

import { AbstractService } from '../Service/AbstractService'
import { ItemsEncryptionService } from './ItemsEncryption'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { DeviceInterface } from '../Device/DeviceInterface'
import { StorageServiceInterface } from '../Storage/StorageServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent } from '../Event/SyncEvent'
import { RootKeyEncryptionService } from './RootKeyEncryption'
import { DecryptBackupFileUseCase } from './DecryptBackupFileUseCase'
import { EncryptionServiceEvent } from './EncryptionServiceEvent'
import { DecryptedParameters } from '@standardnotes/encryption/src/Domain/Types/DecryptedParameters'

/**
 * The encryption service is responsible for the encryption and decryption of payloads, and
 * handles delegation of a task to the respective protocol operator. Each version of the protocol
 * (001, 002, 003, 004, etc) uses a respective operator version to perform encryption operations.
 * Operators are located in /protocol/operator.
 * The protocol service depends on the keyManager for determining which key to use for the
 * encryption and decryption of a particular payload.
 * The protocol service is also responsible for dictating which protocol versions are valid,
 * and which are no longer valid or not supported.

 * The key manager is responsible for managing root key and root key wrapper states.
 * When the key manager is initialized, it initiates itself with a keyMode, which
 * dictates the entire flow of key management. The key manager's responsibilities include:
 * - interacting with the device keychain to save or clear the root key
 * - interacting with storage to save root key params or wrapper params, or the wrapped root key.
 * - exposing methods that allow the application to unwrap the root key (unlock the application)
 *
 * It also exposes two primary methods for determining what key should be used to encrypt
 * or decrypt a particular payload. Some payloads are encrypted directly with the rootKey
 * (such as itemsKeys and encryptedStorage). Others are encrypted with itemsKeys (notes, tags, etc).

 * The items key manager manages the lifecycle of items keys.
 * It is responsible for creating the default items key when conditions call for it
 * (such as after the first sync completes and no key exists).
 * It also exposes public methods that allows consumers to retrieve an items key
 * for a particular payload, and also retrieve all available items keys.
*/
export class EncryptionService extends AbstractService<EncryptionServiceEvent> implements EncryptionProviderInterface {
  private operatorManager: OperatorManager
  private readonly itemsEncryption: ItemsEncryptionService
  private readonly rootKeyEncryption: RootKeyEncryptionService
  private rootKeyObserverDisposer: () => void

  constructor(
    private itemManager: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private payloadManager: PayloadManagerInterface,
    public deviceInterface: DeviceInterface,
    private storageService: StorageServiceInterface,
    public readonly keys: KeySystemKeyManagerInterface,
    private identifier: ApplicationIdentifier,
    public crypto: PureCryptoInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.crypto = crypto

    this.operatorManager = new OperatorManager(crypto)

    this.itemsEncryption = new ItemsEncryptionService(
      itemManager,
      payloadManager,
      storageService,
      this.operatorManager,
      keys,
      internalEventBus,
    )

    this.rootKeyEncryption = new RootKeyEncryptionService(
      this.itemManager,
      this.mutator,
      this.operatorManager,
      this.deviceInterface,
      this.storageService,
      this.payloadManager,
      keys,
      this.identifier,
      this.internalEventBus,
    )

    this.rootKeyObserverDisposer = this.rootKeyEncryption.addEventObserver((event) => {
      this.itemsEncryption.userVersion = this.getUserVersion()
      if (event === RootKeyServiceEvent.RootKeyStatusChanged) {
        void this.notifyEvent(EncryptionServiceEvent.RootKeyStatusChanged)
      }
    })

    UuidGenerator.SetGenerator(this.crypto.generateUUID)
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.deviceInterface as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.operatorManager as unknown) = undefined

    this.rootKeyObserverDisposer()
    ;(this.rootKeyObserverDisposer as unknown) = undefined

    this.itemsEncryption.deinit()
    ;(this.itemsEncryption as unknown) = undefined

    this.rootKeyEncryption.deinit()
    ;(this.rootKeyEncryption as unknown) = undefined

    super.deinit()
  }

  /** @throws */
  getKeyPair(): PkcKeyPair {
    const rootKey = this.getRootKey()

    if (!rootKey?.encryptionKeyPair) {
      throw new Error('Account keypair not found')
    }

    return rootKey.encryptionKeyPair
  }

  /** @throws */
  getSigningKeyPair(): PkcKeyPair {
    const rootKey = this.getRootKey()

    if (!rootKey?.signingKeyPair) {
      throw new Error('Account keypair not found')
    }

    return rootKey.signingKeyPair
  }

  hasSigningKeyPair(): boolean {
    return !!this.getRootKey()?.signingKeyPair
  }

  public async initialize() {
    await this.rootKeyEncryption.initialize()
  }

  /**
   * Returns encryption protocol display name for active account/wrapper
   */
  public async getEncryptionDisplayName(): Promise<string> {
    const version = await this.rootKeyEncryption.getEncryptionSourceVersion()

    if (version) {
      return this.operatorManager.operatorForVersion(version).getEncryptionDisplayName()
    }

    throw Error('Attempting to access encryption display name wtihout source')
  }

  public getLatestVersion() {
    return ProtocolVersionLatest
  }

  public hasAccount() {
    return this.rootKeyEncryption.hasAccount()
  }

  public hasRootKeyEncryptionSource(): boolean {
    return this.rootKeyEncryption.hasRootKeyEncryptionSource()
  }

  public getUserVersion(): ProtocolVersion | undefined {
    return this.rootKeyEncryption.getUserVersion()
  }

  public async upgradeAvailable() {
    const accountUpgradeAvailable = this.accountUpgradeAvailable()
    const passcodeUpgradeAvailable = await this.passcodeUpgradeAvailable()
    return accountUpgradeAvailable || passcodeUpgradeAvailable
  }

  public getSureDefaultItemsKey(): ItemsKeyInterface {
    return this.itemsEncryption.getDefaultItemsKey() as ItemsKeyInterface
  }

  async repersistAllItems(): Promise<void> {
    return this.itemsEncryption.repersistAllItems()
  }

  public async reencryptApplicableItemsAfterUserRootKeyChange(): Promise<void> {
    await this.rootKeyEncryption.reencryptApplicableItemsAfterUserRootKeyChange()
  }

  public reencryptKeySystemItemsKeysForVault(keySystemIdentifier: KeySystemIdentifier): Promise<void> {
    return this.rootKeyEncryption.reencryptKeySystemItemsKeysForVault(keySystemIdentifier)
  }

  public async createNewItemsKeyWithRollback(): Promise<() => Promise<void>> {
    return this.rootKeyEncryption.createNewItemsKeyWithRollback()
  }

  public async decryptErroredPayloads(): Promise<void> {
    await this.rootKeyEncryption.decryptErroredRootPayloads()
    await this.itemsEncryption.decryptErroredItemPayloads()
  }

  public itemsKeyForEncryptedPayload(
    payload: EncryptedPayloadInterface,
  ): ItemsKeyInterface | KeySystemItemsKeyInterface | undefined {
    return this.itemsEncryption.itemsKeyForEncryptedPayload(payload)
  }

  public defaultItemsKeyForItemVersion(
    version: ProtocolVersion,
    fromKeys?: ItemsKeyInterface[],
  ): ItemsKeyInterface | undefined {
    return this.itemsEncryption.defaultItemsKeyForItemVersion(version, fromKeys)
  }

  public async encryptSplitSingle(split: KeyedEncryptionSplit): Promise<EncryptedPayloadInterface> {
    return (await this.encryptSplit(split))[0]
  }

  public async encryptSplit(split: KeyedEncryptionSplit): Promise<EncryptedPayloadInterface[]> {
    const allEncryptedParams: EncryptedOutputParameters[] = []

    const {
      usesRootKey,
      usesItemsKey,
      usesKeySystemRootKey,
      usesRootKeyWithKeyLookup,
      usesItemsKeyWithKeyLookup,
      usesKeySystemRootKeyWithKeyLookup,
    } = split

    const signingKeyPair = this.hasSigningKeyPair() ? this.getSigningKeyPair() : undefined

    if (usesRootKey) {
      const rootKeyEncrypted = await this.rootKeyEncryption.encryptPayloads(
        usesRootKey.items,
        usesRootKey.key,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, rootKeyEncrypted)
    }

    if (usesRootKeyWithKeyLookup) {
      const rootKeyEncrypted = await this.rootKeyEncryption.encryptPayloadsWithKeyLookup(
        usesRootKeyWithKeyLookup.items,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, rootKeyEncrypted)
    }

    if (usesKeySystemRootKey) {
      const keySystemRootKeyEncrypted = await this.rootKeyEncryption.encryptPayloads(
        usesKeySystemRootKey.items,
        usesKeySystemRootKey.key,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, keySystemRootKeyEncrypted)
    }

    if (usesKeySystemRootKeyWithKeyLookup) {
      const keySystemRootKeyEncrypted = await this.rootKeyEncryption.encryptPayloadsWithKeyLookup(
        usesKeySystemRootKeyWithKeyLookup.items,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, keySystemRootKeyEncrypted)
    }

    if (usesItemsKey) {
      const itemsKeyEncrypted = await this.itemsEncryption.encryptPayloads(
        usesItemsKey.items,
        usesItemsKey.key,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, itemsKeyEncrypted)
    }

    if (usesItemsKeyWithKeyLookup) {
      const itemsKeyEncrypted = await this.itemsEncryption.encryptPayloadsWithKeyLookup(
        usesItemsKeyWithKeyLookup.items,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, itemsKeyEncrypted)
    }

    const packagedEncrypted = allEncryptedParams.map((encryptedParams) => {
      const original = FindPayloadInEncryptionSplit(encryptedParams.uuid, split)
      return new EncryptedPayload({
        ...original,
        ...encryptedParams,
        waitingForKey: false,
        errorDecrypting: false,
      })
    })

    return packagedEncrypted
  }

  public async decryptSplitSingle<
    C extends ItemContent = ItemContent,
    P extends DecryptedPayloadInterface<C> = DecryptedPayloadInterface<C>,
  >(split: KeyedDecryptionSplit): Promise<P | EncryptedPayloadInterface> {
    const results = await this.decryptSplit<C, P>(split)
    return results[0]
  }

  public async decryptSplit<
    C extends ItemContent = ItemContent,
    P extends DecryptedPayloadInterface<C> = DecryptedPayloadInterface<C>,
  >(split: KeyedDecryptionSplit): Promise<(P | EncryptedPayloadInterface)[]> {
    const resultParams: (DecryptedParameters<C> | ErrorDecryptingParameters)[] = []

    const {
      usesRootKey,
      usesItemsKey,
      usesKeySystemRootKey,
      usesRootKeyWithKeyLookup,
      usesItemsKeyWithKeyLookup,
      usesKeySystemRootKeyWithKeyLookup,
    } = split

    if (usesRootKey) {
      const rootKeyDecrypted = await this.rootKeyEncryption.decryptPayloads<C>(usesRootKey.items, usesRootKey.key)
      extendArray(resultParams, rootKeyDecrypted)
    }

    if (usesRootKeyWithKeyLookup) {
      const rootKeyDecrypted = await this.rootKeyEncryption.decryptPayloadsWithKeyLookup<C>(
        usesRootKeyWithKeyLookup.items,
      )
      extendArray(resultParams, rootKeyDecrypted)
    }
    if (usesKeySystemRootKey) {
      const keySystemRootKeyDecrypted = await this.rootKeyEncryption.decryptPayloads<C>(
        usesKeySystemRootKey.items,
        usesKeySystemRootKey.key,
      )
      extendArray(resultParams, keySystemRootKeyDecrypted)
    }
    if (usesKeySystemRootKeyWithKeyLookup) {
      const keySystemRootKeyDecrypted = await this.rootKeyEncryption.decryptPayloadsWithKeyLookup<C>(
        usesKeySystemRootKeyWithKeyLookup.items,
      )
      extendArray(resultParams, keySystemRootKeyDecrypted)
    }

    if (usesItemsKey) {
      const itemsKeyDecrypted = await this.itemsEncryption.decryptPayloads<C>(usesItemsKey.items, usesItemsKey.key)
      extendArray(resultParams, itemsKeyDecrypted)
    }

    if (usesItemsKeyWithKeyLookup) {
      const itemsKeyDecrypted = await this.itemsEncryption.decryptPayloadsWithKeyLookup<C>(
        usesItemsKeyWithKeyLookup.items,
      )
      extendArray(resultParams, itemsKeyDecrypted)
    }

    const packagedResults = resultParams.map((params) => {
      const original = FindPayloadInDecryptionSplit(params.uuid, split)

      if (isErrorDecryptingParameters(params)) {
        return new EncryptedPayload({
          ...original.ejected(),
          ...params,
        })
      } else {
        return new DecryptedPayload<C>({
          ...original.ejected(),
          ...params,
        }) as P
      }
    })

    return packagedResults
  }

  async decryptPayloadWithKeyLookup<
    C extends ItemContent = ItemContent,
    P extends DecryptedPayloadInterface<C> = DecryptedPayloadInterface<C>,
  >(
    payload: EncryptedPayloadInterface,
  ): Promise<{
    parameters: DecryptedParameters<C> | ErrorDecryptingParameters
    payload: P | EncryptedPayloadInterface
  }> {
    const decryptedParameters = await this.itemsEncryption.decryptPayloadWithKeyLookup<C>(payload)

    if (isErrorDecryptingParameters(decryptedParameters)) {
      return {
        parameters: decryptedParameters,
        payload: new EncryptedPayload({
          ...payload.ejected(),
          ...decryptedParameters,
        }),
      }
    } else {
      return {
        parameters: decryptedParameters,
        payload: new DecryptedPayload<C>({
          ...payload.ejected(),
          ...decryptedParameters,
        }) as P,
      }
    }
  }

  /**
   * Returns true if the user's account protocol version is not equal to the latest version.
   */
  public accountUpgradeAvailable(): boolean {
    const userVersion = this.getUserVersion()
    if (!userVersion) {
      return false
    }
    return userVersion !== ProtocolVersionLatest
  }

  /**
   * Returns true if the user's account protocol version is not equal to the latest version.
   */
  public async passcodeUpgradeAvailable(): Promise<boolean> {
    return this.rootKeyEncryption.passcodeUpgradeAvailable()
  }

  /**
   * Determines whether the current environment is capable of supporting
   * key derivation.
   */
  public platformSupportsKeyDerivation(keyParams: SNRootKeyParams) {
    /**
     * If the version is 003 or lower, key derivation is supported unless the browser is
     * IE or Edge (or generally, where WebCrypto is not available) or React Native environment is detected.
     *
     * Versions 004 and above are always supported.
     */
    if (compareVersions(keyParams.version, ProtocolVersion.V004) >= 0) {
      /* keyParams.version >= 004 */
      return true
    } else {
      return !!isWebCryptoAvailable() || isReactNativeEnvironment()
    }
  }

  public supportedVersions(): ProtocolVersion[] {
    return [ProtocolVersion.V001, ProtocolVersion.V002, ProtocolVersion.V003, ProtocolVersion.V004]
  }

  /**
   * Determines whether the input version is greater than the latest supported library version.
   */
  public isVersionNewerThanLibraryVersion(version: ProtocolVersion) {
    const libraryVersion = ProtocolVersionLatest
    return compareVersions(version, libraryVersion) === 1
  }

  /**
   * Versions 001 and 002 of the protocol supported dynamic costs, as reported by the server.
   * This function returns the client-enforced minimum cost, to prevent the server from
   * overwhelmingly under-reporting the cost.
   */
  public costMinimumForVersion(version: ProtocolVersion) {
    if (compareVersions(version, ProtocolVersion.V003) >= 0) {
      throw 'Cost minimums only apply to versions <= 002'
    }
    if (version === ProtocolVersion.V001) {
      return V001Algorithm.PbkdfMinCost
    } else if (version === ProtocolVersion.V002) {
      return V002Algorithm.PbkdfMinCost
    } else {
      throw `Invalid version for cost minimum: ${version}`
    }
  }

  /**
   * Computes a root key given a password and key params.
   * Delegates computation to respective protocol operator.
   */
  public async computeRootKey<K extends RootKeyInterface>(password: string, keyParams: SNRootKeyParams): Promise<K> {
    return this.rootKeyEncryption.computeRootKey(password, keyParams)
  }

  /**
   * Creates a root key using the latest protocol version
   */
  public async createRootKey<K extends RootKeyInterface>(
    identifier: string,
    password: string,
    origination: KeyParamsOrigination,
    version?: ProtocolVersion,
  ): Promise<K> {
    return this.rootKeyEncryption.createRootKey(identifier, password, origination, version)
  }

  createRandomizedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
    systemDescription?: string
  }): KeySystemRootKeyInterface {
    return this.operatorManager.defaultOperator().createRandomizedKeySystemRootKey(dto)
  }

  createUserInputtedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
    systemDescription?: string
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    return this.operatorManager.defaultOperator().createUserInputtedKeySystemRootKey(dto)
  }

  deriveUserInputtedKeySystemRootKey(dto: {
    keyParams: KeySystemRootKeyParamsInterface
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    return this.operatorManager.defaultOperator().deriveUserInputtedKeySystemRootKey(dto)
  }

  createKeySystemItemsKey(
    uuid: string,
    keySystemIdentifier: KeySystemIdentifier,
    sharedVaultUuid: string | undefined,
    rootKeyToken: string,
  ): KeySystemItemsKeyInterface {
    return this.operatorManager
      .defaultOperator()
      .createKeySystemItemsKey(uuid, keySystemIdentifier, sharedVaultUuid, rootKeyToken)
  }

  asymmetricallyEncryptMessage(dto: {
    message: AsymmetricMessagePayload
    senderKeyPair: PkcKeyPair
    senderSigningKeyPair: PkcKeyPair
    recipientPublicKey: string
  }): AsymmetricallyEncryptedString {
    const operator = this.operatorManager.defaultOperator()
    const encrypted = operator.asymmetricEncrypt({
      stringToEncrypt: JSON.stringify(dto.message),
      senderKeyPair: dto.senderKeyPair,
      senderSigningKeyPair: dto.senderSigningKeyPair,
      recipientPublicKey: dto.recipientPublicKey,
    })
    return encrypted
  }

  asymmetricallyDecryptMessage<M extends AsymmetricMessagePayload>(dto: {
    encryptedString: AsymmetricallyEncryptedString
    trustedSender: TrustedContactInterface | undefined
    privateKey: string
  }): M | undefined {
    const defaultOperator = this.operatorManager.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(dto.encryptedString)
    const keyOperator = this.operatorManager.operatorForVersion(version)
    const decryptedResult = keyOperator.asymmetricDecrypt({
      stringToDecrypt: dto.encryptedString,
      recipientSecretKey: dto.privateKey,
    })

    if (!decryptedResult) {
      return undefined
    }

    if (!decryptedResult.signatureVerified) {
      return undefined
    }

    if (dto.trustedSender) {
      if (!dto.trustedSender.isPublicKeyTrusted(decryptedResult.senderPublicKey)) {
        return undefined
      }

      if (!dto.trustedSender.isSigningKeyTrusted(decryptedResult.signaturePublicKey)) {
        return undefined
      }
    }

    return JSON.parse(decryptedResult.plaintext)
  }

  asymmetricSignatureVerifyDetached(
    encryptedString: AsymmetricallyEncryptedString,
  ): AsymmetricSignatureVerificationDetachedResult {
    const defaultOperator = this.operatorManager.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(encryptedString)
    const keyOperator = this.operatorManager.operatorForVersion(version)
    return keyOperator.asymmetricSignatureVerifyDetached(encryptedString)
  }

  getSenderPublicKeySetFromAsymmetricallyEncryptedString(string: AsymmetricallyEncryptedString): PublicKeySet {
    const defaultOperator = this.operatorManager.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(string)

    const keyOperator = this.operatorManager.operatorForVersion(version)
    return keyOperator.getSenderPublicKeySetFromAsymmetricallyEncryptedString(string)
  }

  public async decryptBackupFile(
    file: BackupFile,
    password?: string,
  ): Promise<ClientDisplayableError | (EncryptedPayloadInterface | DecryptedPayloadInterface<ItemContent>)[]> {
    const usecase = new DecryptBackupFileUseCase(this)
    const result = await usecase.execute(file, password)
    return result
  }

  /**
   * Creates a key params object from a raw object
   * @param keyParams - The raw key params object to create a KeyParams object from
   */
  public createKeyParams(keyParams: AnyKeyParamsContent) {
    return CreateAnyKeyParams(keyParams)
  }

  public async createEncryptedBackupFile(): Promise<BackupFile> {
    const payloads = this.itemManager.items.map((item) => item.payload)

    const split = SplitPayloadsByEncryptionType(payloads)

    const keyLookupSplit = CreateEncryptionSplitWithKeyLookup(split)

    const result = await this.encryptSplit(keyLookupSplit)

    const ejected = result.map((payload) => CreateEncryptedBackupFileContextPayload(payload))

    const data: BackupFile = {
      version: ProtocolVersionLatest,
      items: ejected,
    }

    const keyParams = this.getRootKeyParams()
    data.keyParams = keyParams?.getPortableValue()
    return data
  }

  public createDecryptedBackupFile(): BackupFile {
    const payloads = this.payloadManager.nonDeletedItems.filter((item) => item.content_type !== ContentType.ItemsKey)

    const data: BackupFile = {
      version: ProtocolVersionLatest,
      items: payloads
        .map((payload) => {
          if (isDecryptedPayload(payload)) {
            return CreateDecryptedBackupFileContextPayload(payload)
          } else if (isEncryptedPayload(payload)) {
            return CreateEncryptedBackupFileContextPayload(payload)
          }
          return undefined
        })
        .filter(isNotUndefined),
    }

    return data
  }

  public hasPasscode(): boolean {
    return this.rootKeyEncryption.hasPasscode()
  }

  /**
   * @returns True if the root key has not yet been unwrapped (passcode locked).
   */
  public async isPasscodeLocked() {
    return (await this.rootKeyEncryption.hasRootKeyWrapper()) && this.rootKeyEncryption.getRootKey() == undefined
  }

  public getRootKeyParams() {
    return this.rootKeyEncryption.getRootKeyParams()
  }

  public getAccountKeyParams() {
    return this.rootKeyEncryption.memoizedRootKeyParams
  }

  /**
   * Computes the root key wrapping key given a passcode.
   * Wrapping key params are read from disk.
   */
  public async computeWrappingKey(passcode: string) {
    const keyParams = this.rootKeyEncryption.getSureRootKeyWrapperKeyParams()
    const key = await this.computeRootKey(passcode, keyParams)
    return key
  }

  /**
   * Unwraps the persisted root key value using the supplied wrappingKey.
   * Application interfaces must check to see if the root key requires unwrapping on load.
   * If so, they must generate the unwrapping key by getting our saved wrapping key keyParams.
   * After unwrapping, the root key is automatically loaded.
   */
  public async unwrapRootKey(wrappingKey: RootKeyInterface) {
    return this.rootKeyEncryption.unwrapRootKey(wrappingKey)
  }
  /**
   * Encrypts rootKey and saves it in storage instead of keychain, and then
   * clears keychain. This is because we don't want to store large encrypted
   * payloads in the keychain. If the root key is not wrapped, it is stored
   * in plain form in the user's secure keychain.
   */
  public async setNewRootKeyWrapper(wrappingKey: SNRootKey) {
    return this.rootKeyEncryption.setNewRootKeyWrapper(wrappingKey)
  }

  public async removePasscode(): Promise<void> {
    await this.rootKeyEncryption.removeRootKeyWrapper()
  }

  public async setRootKey(key: RootKeyInterface, wrappingKey?: SNRootKey) {
    await this.rootKeyEncryption.setRootKey(key, wrappingKey)
  }

  /**
   * Returns the in-memory root key value.
   */
  public getRootKey(): RootKeyInterface | undefined {
    return this.rootKeyEncryption.getRootKey()
  }

  public getSureRootKey(): RootKeyInterface {
    return this.rootKeyEncryption.getRootKey() as RootKeyInterface
  }

  /**
   * Deletes root key and wrapper from keychain. Used when signing out of application.
   */
  public async deleteWorkspaceSpecificKeyStateFromDevice() {
    await this.rootKeyEncryption.deleteWorkspaceSpecificKeyStateFromDevice()
  }

  public async validateAccountPassword(password: string) {
    return this.rootKeyEncryption.validateAccountPassword(password)
  }

  public async validatePasscode(passcode: string) {
    return this.rootKeyEncryption.validatePasscode(passcode)
  }

  public getEmbeddedPayloadAuthenticatedData<D extends ItemAuthenticatedData>(
    payload: EncryptedPayloadInterface,
  ): D | undefined {
    const version = payload.version
    if (!version) {
      return undefined
    }

    const operator = this.operatorManager.operatorForVersion(version)

    const authenticatedData = operator.getPayloadAuthenticatedDataForExternalUse(
      encryptedInputParametersFromPayload(payload),
    )

    return authenticatedData as D
  }

  /** Returns the key params attached to this key's encrypted payload */
  public getKeyEmbeddedKeyParamsFromItemsKey(key: EncryptedPayloadInterface): SNRootKeyParams | undefined {
    const authenticatedData = this.getEmbeddedPayloadAuthenticatedData(key)
    if (!authenticatedData) {
      return undefined
    }
    if (isVersionLessThanOrEqualTo(key.version, ProtocolVersion.V003)) {
      const rawKeyParams = authenticatedData as unknown as LegacyAttachedData
      return this.createKeyParams(rawKeyParams)
    } else {
      const rawKeyParams = (authenticatedData as RootKeyEncryptedAuthenticatedData).kp
      return this.createKeyParams(rawKeyParams)
    }
  }

  /**
   * A new rootkey-based items key is needed if a user changes their account password
   * on an 003 client and syncs on a signed in 004 client.
   */
  public needsNewRootKeyBasedItemsKey(): boolean {
    if (!this.hasAccount()) {
      return false
    }

    const rootKey = this.rootKeyEncryption.getRootKey()
    if (!rootKey) {
      return false
    }

    if (compareVersions(rootKey.keyVersion, ProtocolVersionLastNonrootItemsKey) > 0) {
      /** Is >= 004, not needed */
      return false
    }

    /**
     * A new root key based items key is needed if our default items key content
     * isnt equal to our current root key
     */
    const defaultItemsKey = findDefaultItemsKey(this.itemsEncryption.getItemsKeys())

    /** Shouldn't be undefined, but if it is, we'll take the corrective action */
    if (!defaultItemsKey) {
      return true
    }

    return defaultItemsKey.itemsKey !== rootKey.itemsKey
  }

  public async createNewDefaultItemsKey(): Promise<ItemsKeyInterface> {
    return this.rootKeyEncryption.createNewDefaultItemsKey()
  }

  public getPasswordCreatedDate(): Date | undefined {
    const rootKey = this.getRootKey()
    return rootKey ? rootKey.keyParams.createdDate : undefined
  }

  public async onSyncEvent(eventName: SyncEvent) {
    if (eventName === SyncEvent.SyncCompletedWithAllItemsUploaded) {
      await this.handleFullSyncCompletion()
    }
    if (eventName === SyncEvent.DownloadFirstSyncCompleted) {
      await this.handleDownloadFirstSyncCompletion()
    }
  }

  /**
   * When a download-first sync completes, it means we've completed a (potentially multipage)
   * sync where we only downloaded what the server had before uploading anything. We will be
   * allowed to make local accomadations here before the server begins with the upload
   * part of the sync (automatically runs after download-first sync completes).
   * We use this to see if the server has any default itemsKeys, and if so, allows us to
   * delete any never-synced items keys we have here locally.
   */
  private async handleDownloadFirstSyncCompletion() {
    if (!this.hasAccount()) {
      return
    }

    const itemsKeys = this.itemsEncryption.getItemsKeys()

    const neverSyncedKeys = itemsKeys.filter((key) => {
      return key.neverSynced
    })

    const syncedKeys = itemsKeys.filter((key) => {
      return !key.neverSynced
    })

    /**
     * Find isDefault items key that have been previously synced.
     * If we find one, this means we can delete any non-synced keys.
     */
    const defaultSyncedKey = syncedKeys.find((key) => {
      return key.isDefault
    })

    const hasSyncedItemsKey = !isNullOrUndefined(defaultSyncedKey)
    if (hasSyncedItemsKey) {
      /** Delete all never synced keys */
      await this.mutator.setItemsToBeDeleted(neverSyncedKeys)
    } else {
      /**
       * No previous synced items key.
       * We can keep the one(s) we have, only if their version is equal to our root key
       * version. If their version is not equal to our root key version, delete them. If
       * we end up with 0 items keys, create a new one. This covers the case when you open
       * the app offline and it creates an 004 key, and then you sign into an 003 account.
       */
      const rootKeyParams = this.getRootKeyParams()
      if (rootKeyParams) {
        /** If neverSynced.version != rootKey.version, delete. */
        const toDelete = neverSyncedKeys.filter((itemsKey) => {
          return itemsKey.keyVersion !== rootKeyParams.version
        })
        if (toDelete.length > 0) {
          await this.mutator.setItemsToBeDeleted(toDelete)
        }

        if (this.itemsEncryption.getItemsKeys().length === 0) {
          await this.rootKeyEncryption.createNewDefaultItemsKey()
        }
      }
    }
    /** If we do not have an items key for our current account version, create one */
    const userVersion = this.getUserVersion()
    const accountVersionedKey = this.itemsEncryption.getItemsKeys().find((key) => key.keyVersion === userVersion)
    if (isNullOrUndefined(accountVersionedKey)) {
      await this.rootKeyEncryption.createNewDefaultItemsKey()
    }

    this.syncUnsyncedItemsKeys()
  }

  private async handleFullSyncCompletion() {
    /** Always create a new items key after full sync, if no items key is found */
    const currentItemsKey = findDefaultItemsKey(this.itemsEncryption.getItemsKeys())
    if (!currentItemsKey) {
      await this.rootKeyEncryption.createNewDefaultItemsKey()
      if (this.rootKeyEncryption.keyMode === KeyMode.WrapperOnly) {
        return this.itemsEncryption.repersistAllItems()
      }
    }
  }

  /**
   * There is presently an issue where an items key created while signed out of account (
   * or possibly signed in but with invalid session), then signing into account, results in that
   * items key never syncing to the account even though it is being used to encrypt synced items.
   * Until we can determine its cause, this corrective function will find any such keys and sync them.
   */
  private syncUnsyncedItemsKeys(): void {
    if (!this.hasAccount()) {
      return
    }

    const unsyncedKeys = this.itemsEncryption.getItemsKeys().filter((key) => key.neverSynced && !key.dirty)
    if (unsyncedKeys.length > 0) {
      void this.mutator.setItemsDirty(unsyncedKeys)
    }
  }
}
