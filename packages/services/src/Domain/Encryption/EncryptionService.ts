import { GetKeyPairs } from './UseCase/GetKeyPairs'
import { FindDefaultItemsKey } from './UseCase/ItemsKey/FindDefaultItemsKey'
import { InternalEventInterface } from './../Internal/InternalEventInterface'
import { InternalEventHandlerInterface } from './../Internal/InternalEventHandlerInterface'
import { MutatorClientInterface } from './../Mutator/MutatorClientInterface'
import {
  CreateAnyKeyParams,
  encryptedInputParametersFromPayload,
  ErrorDecryptingParameters,
  FindPayloadInDecryptionSplit,
  FindPayloadInEncryptionSplit,
  isErrorDecryptingParameters,
  ItemAuthenticatedData,
  KeyedDecryptionSplit,
  KeyedEncryptionSplit,
  LegacyAttachedData,
  RootKeyEncryptedAuthenticatedData,
  V001Algorithm,
  V002Algorithm,
  EncryptedOutputParameters,
  AsymmetricSignatureVerificationDetachedResult,
  AsymmetricallyEncryptedString,
  EncryptionOperatorsInterface,
} from '@standardnotes/encryption'
import {
  DecryptedPayload,
  DecryptedPayloadInterface,
  EncryptedPayload,
  EncryptedPayloadInterface,
  ItemContent,
  ItemsKeyInterface,
  RootKeyInterface,
  KeySystemItemsKeyInterface,
  KeySystemIdentifier,
  KeySystemRootKeyInterface,
  KeySystemRootKeyParamsInterface,
  PortablePublicKeySet,
  RootKeyParamsInterface,
} from '@standardnotes/models'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import {
  extendArray,
  isNullOrUndefined,
  isReactNativeEnvironment,
  isWebCryptoAvailable,
  UuidGenerator,
} from '@standardnotes/utils'
import {
  AnyKeyParamsContent,
  compareVersions,
  isVersionLessThanOrEqualTo,
  KeyParamsOrigination,
  ProtocolVersion,
  ProtocolVersionLastNonrootItemsKey,
  ProtocolVersionLatest,
} from '@standardnotes/common'

import { AbstractService } from '../Service/AbstractService'
import { ItemsEncryptionService } from '../ItemsEncryption/ItemsEncryption'
import { ItemManagerInterface } from '../Item/ItemManagerInterface'
import { PayloadManagerInterface } from '../Payloads/PayloadManagerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { SyncEvent } from '../Event/SyncEvent'
import { EncryptionServiceEvent } from './EncryptionServiceEvent'
import { DecryptedParameters } from '@standardnotes/encryption/src/Domain/Types/DecryptedParameters'
import { RootKeyManager } from '../RootKeyManager/RootKeyManager'
import { RootKeyManagerEvent } from '../RootKeyManager/RootKeyManagerEvent'
import { CreateNewItemsKeyWithRollback } from './UseCase/ItemsKey/CreateNewItemsKeyWithRollback'
import { CreateNewDefaultItemsKey } from './UseCase/ItemsKey/CreateNewDefaultItemsKey'
import { DecryptTypeAPayload } from './UseCase/TypeA/DecryptPayload'
import { DecryptTypeAPayloadWithKeyLookup } from './UseCase/TypeA/DecryptPayloadWithKeyLookup'
import { EncryptTypeAPayloadWithKeyLookup } from './UseCase/TypeA/EncryptPayloadWithKeyLookup'
import { EncryptTypeAPayload } from './UseCase/TypeA/EncryptPayload'
import { ValidateAccountPasswordResult } from '../RootKeyManager/ValidateAccountPasswordResult'
import { ValidatePasscodeResult } from '../RootKeyManager/ValidatePasscodeResult'
import { EncryptionProviderInterface } from './EncryptionProviderInterface'
import { KeyMode } from '../RootKeyManager/KeyMode'

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
export class EncryptionService
  extends AbstractService<EncryptionServiceEvent>
  implements EncryptionProviderInterface, InternalEventHandlerInterface
{
  constructor(
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private payloads: PayloadManagerInterface,
    private operators: EncryptionOperatorsInterface,
    private itemsEncryption: ItemsEncryptionService,
    private rootKeyManager: RootKeyManager,
    private crypto: PureCryptoInterface,
    private _createNewItemsKeyWithRollback: CreateNewItemsKeyWithRollback,
    private _findDefaultItemsKey: FindDefaultItemsKey,
    private _rootKeyEncryptPayloadWithKeyLookup: EncryptTypeAPayloadWithKeyLookup,
    private _rootKeyEncryptPayload: EncryptTypeAPayload,
    private _rootKeyDecryptPayload: DecryptTypeAPayload,
    private _rootKeyDecryptPayloadWithKeyLookup: DecryptTypeAPayloadWithKeyLookup,
    private _createDefaultItemsKey: CreateNewDefaultItemsKey,
    private _getKeyPairs: GetKeyPairs,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    internalEventBus.addEventHandler(this, RootKeyManagerEvent.RootKeyManagerKeyStatusChanged)

    UuidGenerator.SetGenerator(this.crypto.generateUUID)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === RootKeyManagerEvent.RootKeyManagerKeyStatusChanged) {
      this.itemsEncryption.userVersion = this.getUserVersion()
      void this.notifyEvent(EncryptionServiceEvent.RootKeyStatusChanged)
    }
  }

  public override deinit(): void {
    ;(this.items as unknown) = undefined
    ;(this.payloads as unknown) = undefined
    ;(this.operators as unknown) = undefined
    ;(this.itemsEncryption as unknown) = undefined
    ;(this.rootKeyManager as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this._createNewItemsKeyWithRollback as unknown) = undefined
    ;(this._findDefaultItemsKey as unknown) = undefined
    ;(this._rootKeyEncryptPayloadWithKeyLookup as unknown) = undefined
    ;(this._rootKeyEncryptPayload as unknown) = undefined
    ;(this._rootKeyDecryptPayload as unknown) = undefined
    ;(this._rootKeyDecryptPayloadWithKeyLookup as unknown) = undefined
    ;(this._createDefaultItemsKey as unknown) = undefined

    super.deinit()
  }

  hasSigningKeyPair(): boolean {
    return !!this.getRootKey()?.signingKeyPair
  }

  public async initialize(): Promise<void> {
    await this.rootKeyManager.initialize()
  }

  /**
   * Returns encryption protocol display name for active account/wrapper
   */
  public async getEncryptionDisplayName(): Promise<string> {
    const version = await this.rootKeyManager.getEncryptionSourceVersion()

    if (version) {
      return this.operators.operatorForVersion(version).getEncryptionDisplayName()
    }

    throw Error('Attempting to access encryption display name wtihout source')
  }

  public getLatestVersion() {
    return ProtocolVersionLatest
  }

  /** Unlike SessionManager.isSignedIn, hasAccount can be read before the application is unlocked and is based on the key state */
  public hasAccount() {
    return this.rootKeyManager.hasAccount()
  }

  public hasRootKeyEncryptionSource(): boolean {
    return this.rootKeyManager.hasRootKeyEncryptionSource()
  }

  public getUserVersion(): ProtocolVersion | undefined {
    return this.rootKeyManager.getUserVersion()
  }

  public async upgradeAvailable(): Promise<boolean> {
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

  public async createNewItemsKeyWithRollback(): Promise<() => Promise<void>> {
    return this._createNewItemsKeyWithRollback.execute()
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

    const keys = this._getKeyPairs.execute()

    const signingKeyPair = keys.isFailed() ? undefined : keys.getValue().signing

    if (usesRootKey) {
      const rootKeyEncrypted = await this._rootKeyEncryptPayload.executeMany(
        usesRootKey.items,
        usesRootKey.key,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, rootKeyEncrypted)
    }

    if (usesRootKeyWithKeyLookup) {
      const rootKeyEncrypted = await this._rootKeyEncryptPayloadWithKeyLookup.executeMany(
        usesRootKeyWithKeyLookup.items,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, rootKeyEncrypted)
    }

    if (usesKeySystemRootKey) {
      const keySystemRootKeyEncrypted = await this._rootKeyEncryptPayload.executeMany(
        usesKeySystemRootKey.items,
        usesKeySystemRootKey.key,
        signingKeyPair,
      )
      extendArray(allEncryptedParams, keySystemRootKeyEncrypted)
    }

    if (usesKeySystemRootKeyWithKeyLookup) {
      const keySystemRootKeyEncrypted = await this._rootKeyEncryptPayloadWithKeyLookup.executeMany(
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
      const rootKeyDecrypted = await this._rootKeyDecryptPayload.executeMany<C>(usesRootKey.items, usesRootKey.key)
      extendArray(resultParams, rootKeyDecrypted)
    }

    if (usesRootKeyWithKeyLookup) {
      const rootKeyDecrypted = await this._rootKeyDecryptPayloadWithKeyLookup.executeMany<C>(
        usesRootKeyWithKeyLookup.items,
      )
      extendArray(resultParams, rootKeyDecrypted)
    }
    if (usesKeySystemRootKey) {
      const keySystemRootKeyDecrypted = await this._rootKeyDecryptPayload.executeMany<C>(
        usesKeySystemRootKey.items,
        usesKeySystemRootKey.key,
      )
      extendArray(resultParams, keySystemRootKeyDecrypted)
    }
    if (usesKeySystemRootKeyWithKeyLookup) {
      const keySystemRootKeyDecrypted = await this._rootKeyDecryptPayloadWithKeyLookup.executeMany<C>(
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
    return this.rootKeyManager.passcodeUpgradeAvailable()
  }

  /**
   * Determines whether the current environment is capable of supporting
   * key derivation.
   */
  public platformSupportsKeyDerivation(keyParams: RootKeyParamsInterface) {
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
  public async computeRootKey<K extends RootKeyInterface>(
    password: string,
    keyParams: RootKeyParamsInterface,
  ): Promise<K> {
    return this.rootKeyManager.computeRootKey(password, keyParams)
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
    return this.rootKeyManager.createRootKey(identifier, password, origination, version)
  }

  createRandomizedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
    systemDescription?: string
  }): KeySystemRootKeyInterface {
    return this.operators.defaultOperator().createRandomizedKeySystemRootKey(dto)
  }

  createUserInputtedKeySystemRootKey(dto: {
    systemIdentifier: KeySystemIdentifier
    systemName: string
    systemDescription?: string
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    return this.operators.defaultOperator().createUserInputtedKeySystemRootKey(dto)
  }

  deriveUserInputtedKeySystemRootKey(dto: {
    keyParams: KeySystemRootKeyParamsInterface
    userInputtedPassword: string
  }): KeySystemRootKeyInterface {
    return this.operators.defaultOperator().deriveUserInputtedKeySystemRootKey(dto)
  }

  createKeySystemItemsKey(
    uuid: string,
    keySystemIdentifier: KeySystemIdentifier,
    sharedVaultUuid: string | undefined,
    rootKeyToken: string,
  ): KeySystemItemsKeyInterface {
    return this.operators
      .defaultOperator()
      .createKeySystemItemsKey(uuid, keySystemIdentifier, sharedVaultUuid, rootKeyToken)
  }

  asymmetricSignatureVerifyDetached(
    encryptedString: AsymmetricallyEncryptedString,
  ): AsymmetricSignatureVerificationDetachedResult {
    const defaultOperator = this.operators.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(encryptedString)
    const keyOperator = this.operators.operatorForVersion(version)
    return keyOperator.asymmetricSignatureVerifyDetached(encryptedString)
  }

  getSenderPublicKeySetFromAsymmetricallyEncryptedString(string: AsymmetricallyEncryptedString): PortablePublicKeySet {
    const defaultOperator = this.operators.defaultOperator()
    const version = defaultOperator.versionForAsymmetricallyEncryptedString(string)

    const keyOperator = this.operators.operatorForVersion(version)
    return keyOperator.getSenderPublicKeySetFromAsymmetricallyEncryptedString(string)
  }

  /**
   * Creates a key params object from a raw object
   * @param keyParams - The raw key params object to create a KeyParams object from
   */
  public createKeyParams(keyParams: AnyKeyParamsContent) {
    return CreateAnyKeyParams(keyParams)
  }

  public hasPasscode(): boolean {
    return this.rootKeyManager.hasPasscode()
  }

  /**
   * @returns True if the root key has not yet been unwrapped (passcode locked).
   */
  public async isPasscodeLocked(): Promise<boolean> {
    return (await this.rootKeyManager.hasRootKeyWrapper()) && this.rootKeyManager.getRootKey() == undefined
  }

  public getRootKeyParams() {
    return this.rootKeyManager.getRootKeyParams()
  }

  public getAccountKeyParams() {
    return this.rootKeyManager.getMemoizedRootKeyParams()
  }

  /**
   * Computes the root key wrapping key given a passcode.
   * Wrapping key params are read from disk.
   */
  public async computeWrappingKey(passcode: string) {
    const keyParams = this.rootKeyManager.getSureRootKeyWrapperKeyParams()
    const key = await this.computeRootKey(passcode, keyParams)
    return key
  }

  /**
   * Unwraps the persisted root key value using the supplied wrappingKey.
   * Application interfaces must check to see if the root key requires unwrapping on load.
   * If so, they must generate the unwrapping key by getting our saved wrapping key keyParams.
   * After unwrapping, the root key is automatically loaded.
   */
  public async unwrapRootKey(wrappingKey: RootKeyInterface): Promise<void> {
    return this.rootKeyManager.unwrapRootKey(wrappingKey)
  }
  /**
   * Encrypts rootKey and saves it in storage instead of keychain, and then
   * clears keychain. This is because we don't want to store large encrypted
   * payloads in the keychain. If the root key is not wrapped, it is stored
   * in plain form in the user's secure keychain.
   */
  public async setNewRootKeyWrapper(wrappingKey: RootKeyInterface) {
    return this.rootKeyManager.setNewRootKeyWrapper(wrappingKey)
  }

  public async removePasscode(): Promise<void> {
    await this.rootKeyManager.removeRootKeyWrapper()
  }

  public async setRootKey(key: RootKeyInterface, wrappingKey?: RootKeyInterface) {
    await this.rootKeyManager.setRootKey(key, wrappingKey)
  }

  /**
   * Returns the in-memory root key value.
   */
  public getRootKey(): RootKeyInterface | undefined {
    return this.rootKeyManager.getRootKey()
  }

  public getSureRootKey(): RootKeyInterface {
    return this.rootKeyManager.getRootKey() as RootKeyInterface
  }

  /**
   * Deletes root key and wrapper from keychain. Used when signing out of application.
   */
  public async deleteWorkspaceSpecificKeyStateFromDevice() {
    await this.rootKeyManager.deleteWorkspaceSpecificKeyStateFromDevice()
  }

  public async validateAccountPassword(password: string): Promise<ValidateAccountPasswordResult> {
    return this.rootKeyManager.validateAccountPassword(password)
  }

  public async validatePasscode(passcode: string): Promise<ValidatePasscodeResult> {
    return this.rootKeyManager.validatePasscode(passcode)
  }

  public getEmbeddedPayloadAuthenticatedData<D extends ItemAuthenticatedData>(
    payload: EncryptedPayloadInterface,
  ): D | undefined {
    const version = payload.version
    if (!version) {
      return undefined
    }

    const operator = this.operators.operatorForVersion(version)

    const authenticatedData = operator.getPayloadAuthenticatedDataForExternalUse(
      encryptedInputParametersFromPayload(payload),
    )

    return authenticatedData as D
  }

  /** Returns the key params attached to this key's encrypted payload */
  public getKeyEmbeddedKeyParamsFromItemsKey(key: EncryptedPayloadInterface): RootKeyParamsInterface | undefined {
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

    const rootKey = this.rootKeyManager.getRootKey()
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
    const defaultItemsKey = this._findDefaultItemsKey.execute(this.itemsEncryption.getItemsKeys()).getValue()

    /** Shouldn't be undefined, but if it is, we'll take the corrective action */
    if (!defaultItemsKey) {
      return true
    }

    return defaultItemsKey.itemsKey !== rootKey.itemsKey
  }

  public async createNewDefaultItemsKey(): Promise<ItemsKeyInterface> {
    return this._createDefaultItemsKey.execute()
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
          await this.createNewDefaultItemsKey()
        }
      }
    }
    /** If we do not have an items key for our current account version, create one */
    const userVersion = this.getUserVersion()
    const accountVersionedKey = this.itemsEncryption.getItemsKeys().find((key) => key.keyVersion === userVersion)
    if (isNullOrUndefined(accountVersionedKey)) {
      await this.createNewDefaultItemsKey()
    }

    this.syncUnsyncedItemsKeys()
  }

  private async handleFullSyncCompletion() {
    /** Always create a new items key after full sync, if no items key is found */
    const currentItemsKey = this._findDefaultItemsKey.execute(this.itemsEncryption.getItemsKeys()).getValue()
    if (!currentItemsKey) {
      await this.createNewDefaultItemsKey()
      if (this.rootKeyManager.getKeyMode() === KeyMode.WrapperOnly) {
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
