import { KeyRecoveryOperation } from './KeyRecoveryOperation'
import { SNRootKeyParams, SNRootKey, KeyParamsFromApiResponse, KeyRecoveryStrings } from '@standardnotes/encryption'
import {
  isErrorDecryptingPayload,
  EncryptedPayloadInterface,
  EncryptedPayload,
  isDecryptedPayload,
  DecryptedPayloadInterface,
  PayloadEmitSource,
  EncryptedItemInterface,
  getIncrementedDirtyIndex,
  ContentTypeUsesRootKeyEncryption,
} from '@standardnotes/models'
import { SyncService } from '../Sync/SyncService'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { PayloadManager } from '../Payloads/PayloadManager'
import { ChallengeService } from '../Challenge'
import { LegacyApiService } from '@Lib/Services/Api/ApiService'
import { ItemManager } from '../Items/ItemManager'
import { removeFromArray, Uuids } from '@standardnotes/utils'
import { ClientDisplayableError, isErrorResponse } from '@standardnotes/responses'
import {
  AlertService,
  AbstractService,
  InternalEventBusInterface,
  StorageValueModes,
  ApplicationStage,
  StorageKey,
  DiagnosticInfo,
  ChallengeValidation,
  ChallengeReason,
  ChallengePrompt,
  EncryptionService,
  Challenge,
  UserService,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ApplicationEvent,
  ApplicationStageChangedEventPayload,
} from '@standardnotes/services'
import {
  UndecryptableItemsStorage,
  DecryptionQueueItem,
  KeyRecoveryEvent,
  isSuccessResult,
  KeyRecoveryOperationResult,
} from './Types'
import { serverKeyParamsAreSafe } from './Utils'
import { ContentType } from '@standardnotes/domain-core'

/**
 * The key recovery service listens to items key changes to detect any that cannot be decrypted.
 * If it detects an items key that is not properly decrypted, it will present a key recovery
 * wizard (using existing UI like Challenges and AlertService) that will attempt to recover
 * the root key for those keys.
 *
 * When we encounter an items key we cannot decrypt, this is a sign that the user's password may
 * have recently changed (even though their session is still valid). If the user has been
 * previously signed in, we take this opportunity to reach out to the server to get the
 * user's current key_params. We ensure these key params' version is equal to or greater than our own.

 * - If this key's key params are equal to the retrieved parameters,
    and this keys created date is greater than any existing valid items key,
    or if we do not have any items keys:
       1. Use the decryption of this key as a source of validation
       2. If valid, replace our local root key with this new root key and emit the decrypted items key
 * - Else, if the key params are not equal,
     or its created date is less than an existing valid items key
        1. Attempt to decrypt this key using its attached key paramas
        2. If valid, emit decrypted items key. DO NOT replace local root key.
 * - If by the end we did not find an items key with matching key params to the retrieved
     key params, AND the retrieved key params are newer than what we have locally, we must
     issue a sign in request to the server.

 * If the user is not signed in and we detect an undecryptable items key, we present a detached
 * recovery wizard that doesn't affect our local root key.
 *
 * When an items key is emitted, protocol service will automatically try to decrypt any
 * related items that are in an errored state.
 *
 * In the item observer, `ignored` items represent items who have encrypted overwrite
 * protection enabled (only items keys). This means that if the incoming payload is errored,
 * but our current copy is not, we will ignore the incoming value until we can properly
 * decrypt it.
 */
export class KeyRecoveryService
  extends AbstractService<KeyRecoveryEvent, DecryptedPayloadInterface[]>
  implements InternalEventHandlerInterface
{
  private removeItemObserver: () => void
  private decryptionQueue: DecryptionQueueItem[] = []
  private isProcessingQueue = false

  constructor(
    private itemManager: ItemManager,
    private payloadManager: PayloadManager,
    private apiService: LegacyApiService,
    private encryptionService: EncryptionService,
    private challengeService: ChallengeService,
    private alertService: AlertService,
    private storageService: DiskStorageService,
    private sync: SyncService,
    private userService: UserService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)

    this.removeItemObserver = this.payloadManager.addObserver(
      [ContentType.TYPES.ItemsKey],
      ({ changed, inserted, ignored, source }) => {
        if (source === PayloadEmitSource.LocalChanged) {
          return
        }

        const changedOrInserted = changed.concat(inserted).filter(isErrorDecryptingPayload)

        if (changedOrInserted.length > 0) {
          void this.handleUndecryptableItemsKeys(changedOrInserted)
        }

        if (ignored.length > 0) {
          void this.handleIgnoredItemsKeys(ignored)
        }
      },
    )
  }

  public override deinit(): void {
    ;(this.itemManager as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.apiService as unknown) = undefined
    ;(this.encryptionService as unknown) = undefined
    ;(this.challengeService as unknown) = undefined
    ;(this.alertService as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.sync as unknown) = undefined
    ;(this.userService as unknown) = undefined

    this.removeItemObserver()
    ;(this.removeItemObserver as unknown) = undefined

    super.deinit()
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.ApplicationStageChanged) {
      const stage = (event.payload as ApplicationStageChangedEventPayload).stage
      if (stage === ApplicationStage.LoadedDatabase_12) {
        void this.processPersistedUndecryptables()
      }
    }
  }

  /**
   * Ignored items keys are items keys which arrived from a remote source, which we were
   * not able to decrypt, and for which we already had an existing items key that was
   * properly decrypted. Since items keys key contents are immutable, if we already have a
   * successfully decrypted version, yet we can't decrypt the new version, we should
   * temporarily ignore the new version until we can properly decrypt it (through the recovery flow),
   * and not overwrite the local copy.
   *
   * Ignored items are persisted to disk in isolated storage so that they may be decrypted
   * whenever. When they are finally decryptable, we will emit them and update our database
   * with the new decrypted value.
   *
   * When the app first launches, we will query the isolated storage to see if there are any
   * keys we need to decrypt.
   */
  private async handleIgnoredItemsKeys(keys: EncryptedPayloadInterface[], persistIncoming = true) {
    /**
     * Persist the keys locally in isolated storage, so that if we don't properly decrypt
     * them in this app session, the user has a chance to later. If there already exists
     * the same items key in this storage, replace it with this latest incoming value.
     */
    if (persistIncoming) {
      this.saveToUndecryptables(keys)
    }

    this.addKeysToQueue(keys)

    await this.beginKeyRecovery()
  }

  private async handleUndecryptableItemsKeys(keys: EncryptedPayloadInterface[]) {
    this.addKeysToQueue(keys)

    await this.beginKeyRecovery()
  }

  public presentKeyRecoveryWizard(): void {
    const invalidKeys = this.itemManager.invalidItems
      .filter((i) => i.content_type === ContentType.TYPES.ItemsKey)
      .map((i) => i.payload)

    void this.handleIgnoredItemsKeys(invalidKeys, false)
  }

  public canAttemptDecryptionOfItem(item: EncryptedItemInterface): ClientDisplayableError | true {
    if (ContentTypeUsesRootKeyEncryption(item.content_type)) {
      return true
    }

    const keyId = item.payload.items_key_id

    if (!keyId) {
      return new ClientDisplayableError('This item cannot be recovered.')
    }

    const key = this.payloadManager.findOne(keyId)

    if (!key) {
      return new ClientDisplayableError(
        `Unable to find key ${keyId} for this item. You may try signing out and back in; if that doesn't help, check your backup files for a key with this ID and import it.`,
      )
    }

    return true
  }

  public async processPersistedUndecryptables() {
    const record = this.getUndecryptables()

    const rawPayloads = Object.values(record)

    if (rawPayloads.length === 0) {
      return
    }

    const keys = rawPayloads.map((raw) => new EncryptedPayload(raw))

    return this.handleIgnoredItemsKeys(keys, false)
  }

  private getUndecryptables(): UndecryptableItemsStorage {
    return this.storageService.getValue<UndecryptableItemsStorage>(
      StorageKey.KeyRecoveryUndecryptableItems,
      StorageValueModes.Default,
      {},
    )
  }

  private persistUndecryptables(record: UndecryptableItemsStorage) {
    this.storageService.setValue(StorageKey.KeyRecoveryUndecryptableItems, record)
  }

  private saveToUndecryptables(keys: EncryptedPayloadInterface[]) {
    const record = this.getUndecryptables()

    for (const key of keys) {
      record[key.uuid] = key.ejected()
    }

    this.persistUndecryptables(record)
  }

  private removeFromUndecryptables(keyIds: string[]) {
    const record = this.getUndecryptables()

    for (const id of keyIds) {
      delete record[id]
    }

    this.persistUndecryptables(record)
  }

  private getClientKeyParams() {
    return this.encryptionService.getAccountKeyParams()
  }

  private async performServerSignIn(): Promise<SNRootKey | undefined> {
    const accountPasswordChallenge = new Challenge(
      [new ChallengePrompt(ChallengeValidation.None, undefined, undefined, true)],
      ChallengeReason.Custom,
      true,
      KeyRecoveryStrings.KeyRecoveryLoginFlowReason,
    )

    const challengeResponse = await this.challengeService.promptForChallengeResponse(accountPasswordChallenge)
    if (!challengeResponse) {
      return undefined
    }

    this.challengeService.completeChallenge(accountPasswordChallenge)

    const password = challengeResponse.values[0].value as string

    const clientParams = this.getClientKeyParams() as SNRootKeyParams

    const serverParams = await this.getLatestKeyParamsFromServer(clientParams.identifier)

    if (!serverParams || !serverKeyParamsAreSafe(serverParams, clientParams)) {
      return
    }

    const rootKey = await this.encryptionService.computeRootKey(password, serverParams)

    const signInResponse = await this.userService.correctiveSignIn(rootKey)

    if (!isErrorResponse(signInResponse)) {
      void this.alertService.alert(KeyRecoveryStrings.KeyRecoveryRootKeyReplaced)

      return rootKey
    } else {
      await this.alertService.alert(KeyRecoveryStrings.KeyRecoveryLoginFlowInvalidPassword)

      return this.performServerSignIn()
    }
  }

  private async getWrappingKeyIfApplicable(): Promise<SNRootKey | undefined> {
    if (!this.encryptionService.hasPasscode()) {
      return undefined
    }
    const { wrappingKey, canceled } = await this.challengeService.getWrappingKeyIfApplicable()
    if (canceled) {
      await this.alertService.alert(
        KeyRecoveryStrings.KeyRecoveryPasscodeRequiredText,
        KeyRecoveryStrings.KeyRecoveryPasscodeRequiredTitle,
      )

      return this.getWrappingKeyIfApplicable()
    }
    return wrappingKey
  }

  private addKeysToQueue(keys: EncryptedPayloadInterface[]) {
    for (const key of keys) {
      const keyParams = this.encryptionService.getKeyEmbeddedKeyParamsFromItemsKey(key)
      if (!keyParams) {
        continue
      }

      const queueItem: DecryptionQueueItem = {
        encryptedKey: key,
        keyParams,
      }

      this.decryptionQueue.push(queueItem)
    }
  }

  private readdQueueItem(queueItem: DecryptionQueueItem) {
    this.decryptionQueue.unshift(queueItem)
  }

  private async getLatestKeyParamsFromServer(identifier: string): Promise<SNRootKeyParams | undefined> {
    const paramsResponse = await this.apiService.getAccountKeyParams({
      email: identifier,
    })

    if (!isErrorResponse(paramsResponse)) {
      return KeyParamsFromApiResponse(paramsResponse.data)
    } else {
      return undefined
    }
  }

  private async beginKeyRecovery() {
    if (this.isProcessingQueue) {
      return
    }

    this.isProcessingQueue = true

    const clientParams = this.getClientKeyParams()

    let serverParams: SNRootKeyParams | undefined = undefined
    if (clientParams) {
      serverParams = await this.getLatestKeyParamsFromServer(clientParams.identifier)
    }

    const deallocedAfterNetworkRequest = this.encryptionService == undefined
    if (deallocedAfterNetworkRequest) {
      return
    }

    const credentialsMissing = !this.encryptionService.hasAccount() && !this.encryptionService.hasPasscode()

    if (credentialsMissing) {
      const rootKey = await this.performServerSignIn()

      if (rootKey) {
        const replaceLocalRootKeyWithResult = true
        await this.handleDecryptionOfAllKeysMatchingCorrectRootKey(rootKey, replaceLocalRootKeyWithResult, serverParams)
      }
    }

    await this.processQueue(serverParams)

    if (serverParams) {
      await this.potentiallyPerformFallbackSignInToUpdateOutdatedLocalRootKey(serverParams)
    }

    if (this.sync.isOutOfSync()) {
      void this.sync.sync({ checkIntegrity: true })
    }
  }

  private async potentiallyPerformFallbackSignInToUpdateOutdatedLocalRootKey(serverParams: SNRootKeyParams) {
    const latestClientParamsAfterAllRecoveryOperations = this.getClientKeyParams()

    if (!latestClientParamsAfterAllRecoveryOperations) {
      return
    }

    const serverParamsDiffer = !serverParams.compare(latestClientParamsAfterAllRecoveryOperations)

    if (serverParamsDiffer && serverKeyParamsAreSafe(serverParams, latestClientParamsAfterAllRecoveryOperations)) {
      await this.performServerSignIn()
    }
  }

  private async processQueue(serverParams?: SNRootKeyParams): Promise<void> {
    let queueItem = this.decryptionQueue[0]

    while (queueItem) {
      const result = await this.processQueueItem(queueItem, serverParams)

      removeFromArray(this.decryptionQueue, queueItem)

      if (!isSuccessResult(result) && result.aborted) {
        this.isProcessingQueue = false

        return
      }

      queueItem = this.decryptionQueue[0]
    }

    this.isProcessingQueue = false
  }

  private async processQueueItem(
    queueItem: DecryptionQueueItem,
    serverParams?: SNRootKeyParams,
  ): Promise<KeyRecoveryOperationResult> {
    const clientParams = this.getClientKeyParams()

    const operation = new KeyRecoveryOperation(
      queueItem,
      this.itemManager,
      this.encryptionService,
      this.challengeService,
      clientParams,
      serverParams,
    )

    const result = await operation.run()

    if (!isSuccessResult(result)) {
      if (!result.aborted) {
        await this.alertService.alert(KeyRecoveryStrings.KeyRecoveryUnableToRecover)
        this.readdQueueItem(queueItem)
      }

      return result
    }

    await this.handleDecryptionOfAllKeysMatchingCorrectRootKey(
      result.rootKey,
      result.replaceLocalRootKeyWithResult,
      serverParams,
    )

    return result
  }

  private async handleDecryptionOfAllKeysMatchingCorrectRootKey(
    rootKey: SNRootKey,
    replacesRootKey: boolean,
    serverParams?: SNRootKeyParams,
  ): Promise<void> {
    if (replacesRootKey) {
      const wrappingKey = await this.getWrappingKeyIfApplicable()

      await this.encryptionService.setRootKey(rootKey, wrappingKey)
    }

    const clientKeyParams = this.getClientKeyParams()

    const clientParamsMatchServer = clientKeyParams && serverParams && clientKeyParams.compare(serverParams)

    const matchingKeys = this.removeElementsFromQueueForMatchingKeyParams(rootKey.keyParams).map((qItem) => {
      const needsResync = clientParamsMatchServer && !serverParams.compare(qItem.keyParams)

      return needsResync
        ? qItem.encryptedKey.copy({ dirty: true, dirtyIndex: getIncrementedDirtyIndex() })
        : qItem.encryptedKey
    })

    const matchingResults = await this.encryptionService.decryptSplit({
      usesRootKey: {
        items: matchingKeys,
        key: rootKey,
      },
    })

    const decryptedMatching = matchingResults.filter(isDecryptedPayload)

    void this.payloadManager.emitPayloads(decryptedMatching, PayloadEmitSource.LocalChanged)

    await this.storageService.savePayloads(decryptedMatching)

    if (replacesRootKey) {
      void this.alertService.alert(KeyRecoveryStrings.KeyRecoveryRootKeyReplaced)
    } else {
      void this.alertService.alert(KeyRecoveryStrings.KeyRecoveryKeyRecovered)
    }

    if (decryptedMatching.some((p) => p.dirty)) {
      await this.sync.sync()
    }

    await this.notifyEvent(KeyRecoveryEvent.KeysRecovered, decryptedMatching)

    void this.removeFromUndecryptables(Uuids(decryptedMatching))
  }

  private removeElementsFromQueueForMatchingKeyParams(keyParams: SNRootKeyParams) {
    const matching = []
    const nonmatching = []

    for (const queueItem of this.decryptionQueue) {
      if (queueItem.keyParams.compare(keyParams)) {
        matching.push(queueItem)
      } else {
        nonmatching.push(queueItem)
      }
    }

    this.decryptionQueue = nonmatching

    return matching
  }

  override getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve({
      keyRecovery: {
        queueLength: this.decryptionQueue.length,
        isProcessingQueue: this.isProcessingQueue,
      },
    })
  }
}
