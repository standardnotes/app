import { AccountSyncOperation } from '@Lib/Services/Sync/Account/Operation'
import { ContentType } from '@standardnotes/common'
import {
  extendArray,
  isNotUndefined,
  isNullOrUndefined,
  removeFromIndex,
  sleep,
  subtractFromArray,
  useBoolean,
  Uuids,
} from '@standardnotes/utils'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { OfflineSyncOperation } from '@Lib/Services/Sync/Offline/Operation'
import { PayloadManager } from '../Payloads/PayloadManager'
import { SNApiService } from '../Api/ApiService'
import { SNHistoryManager } from '../History/HistoryManager'
import { SNLog } from '@Lib/Log'
import { SNSessionManager } from '../Session/SessionManager'
import { DiskStorageService } from '../Storage/DiskStorageService'
import { SortPayloadsByRecentAndContentPriority } from '@Lib/Services/Sync/Utils'
import { SyncClientInterface } from './SyncClientInterface'
import { SyncPromise } from './Types'
import { SyncOpStatus } from '@Lib/Services/Sync/SyncOpStatus'
import { ServerSyncResponse } from '@Lib/Services/Sync/Account/Response'
import { ServerSyncResponseResolver } from '@Lib/Services/Sync/Account/ResponseResolver'
import { SyncSignal, SyncStats } from '@Lib/Services/Sync/Signals'
import { UuidString } from '../../Types/UuidString'
import * as Encryption from '@standardnotes/encryption'
import {
  PayloadSource,
  CreateDecryptedItemFromPayload,
  FilterDisallowedRemotePayloadsAndMap,
  DeltaOutOfSync,
  ImmutablePayloadCollection,
  CreatePayload,
  FullyFormedTransferPayload,
  isEncryptedPayload,
  isDecryptedPayload,
  EncryptedPayloadInterface,
  DecryptedPayloadInterface,
  ItemsKeyContent,
  FullyFormedPayloadInterface,
  DeletedPayloadInterface,
  DecryptedPayload,
  CreateEncryptedServerSyncPushPayload,
  ServerSyncPushContextualPayload,
  isDeletedItem,
  DeletedItemInterface,
  DecryptedItemInterface,
  CreatePayloadSplit,
  CreateDeletedServerSyncPushPayload,
  ItemsKeyInterface,
  CreateNonDecryptedPayloadSplit,
  DeltaOfflineSaved,
  FilteredServerItem,
  PayloadEmitSource,
  getIncrementedDirtyIndex,
  getCurrentDirtyIndex,
} from '@standardnotes/models'
import {
  AbstractService,
  SyncEvent,
  SyncSource,
  InternalEventHandlerInterface,
  InternalEventBusInterface,
  StorageKey,
  InternalEventInterface,
  IntegrityEvent,
  IntegrityEventPayload,
  SyncMode,
  SyncOptions,
  SyncQueueStrategy,
  SyncServiceInterface,
  DiagnosticInfo,
} from '@standardnotes/services'
import { OfflineSyncResponse } from './Offline/Response'
import { KeyedDecryptionSplit, SplitPayloadsByEncryptionType } from '@standardnotes/encryption'
import { CreatePayloadFromRawServerItem } from './Account/Utilities'
import { ApplicationSyncOptions } from '@Lib/Application/Options/OptionalOptions'

const DEFAULT_MAJOR_CHANGE_THRESHOLD = 15
const INVALID_SESSION_RESPONSE_STATUS = 401

/**
 * The sync service orchestrates with the model manager, api service, and storage service
 * to ensure consistent state between the three. When a change is made to an item, consumers
 * call the sync service's sync function to first persist pending changes to local storage.
 * Then, the items are uploaded to the server. The sync service handles server responses,
 * including mapping any retrieved items to application state via model manager mapping.
 * After each sync request, any changes made or retrieved are also persisted locally.
 * The sync service largely does not perform any task unless it is called upon.
 */
export class SNSyncService
  extends AbstractService<SyncEvent, ServerSyncResponse | OfflineSyncResponse | { source: SyncSource }>
  implements SyncServiceInterface, InternalEventHandlerInterface, SyncClientInterface
{
  private dirtyIndexAtLastPresyncSave?: number
  private lastSyncDate?: Date
  private outOfSync = false
  private opStatus: SyncOpStatus

  private resolveQueue: SyncPromise[] = []
  private spawnQueue: SyncPromise[] = []

  /* A DownloadFirst sync must always be the first sync completed */
  public completedOnlineDownloadFirstSync = false

  private majorChangeThreshold = DEFAULT_MAJOR_CHANGE_THRESHOLD
  private clientLocked = false
  private databaseLoaded = false

  private syncToken?: string
  private cursorToken?: string

  private syncLock = false
  private _simulate_latency?: { latency: number; enabled: boolean }
  private dealloced = false

  public lastSyncInvokationPromise?: Promise<unknown>
  public currentSyncRequestPromise?: Promise<void>

  /** Content types appearing first are always mapped first */
  private readonly localLoadPriorty = [
    ContentType.ItemsKey,
    ContentType.UserPrefs,
    ContentType.Component,
    ContentType.Theme,
  ]

  constructor(
    private itemManager: ItemManager,
    private sessionManager: SNSessionManager,
    private protocolService: Encryption.EncryptionService,
    private storageService: DiskStorageService,
    private payloadManager: PayloadManager,
    private apiService: SNApiService,
    private historyService: SNHistoryManager,
    private readonly options: ApplicationSyncOptions,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.opStatus = this.initializeStatus()
  }

  /**
   * If the database has been newly created (because its new or was previously destroyed)
   * we want to reset any sync tokens we have.
   */
  public async onNewDatabaseCreated(): Promise<void> {
    if (await this.getLastSyncToken()) {
      await this.clearSyncPositionTokens()
    }
  }

  public override deinit(): void {
    this.dealloced = true
    ;(this.sessionManager as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.protocolService as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.storageService as unknown) = undefined
    ;(this.apiService as unknown) = undefined
    this.opStatus.reset()
    ;(this.opStatus as unknown) = undefined
    this.resolveQueue.length = 0
    this.spawnQueue.length = 0
    super.deinit()
  }

  private initializeStatus() {
    return new SyncOpStatus(setInterval, (event) => {
      void this.notifyEvent(event)
    })
  }

  public lockSyncing(): void {
    this.clientLocked = true
  }

  public unlockSyncing(): void {
    this.clientLocked = false
  }

  public isOutOfSync(): boolean {
    return this.outOfSync
  }

  public getLastSyncDate(): Date | undefined {
    return this.lastSyncDate
  }

  public getSyncStatus(): SyncOpStatus {
    return this.opStatus
  }

  /**
   * Called by application when sign in or registration occurs.
   */
  public resetSyncState(): void {
    this.dirtyIndexAtLastPresyncSave = undefined
    this.lastSyncDate = undefined
    this.outOfSync = false
  }

  public isDatabaseLoaded(): boolean {
    return this.databaseLoaded
  }

  /**
   * Used in tandem with `loadDatabasePayloads`
   */
  public async getDatabasePayloads(): Promise<FullyFormedTransferPayload[]> {
    return this.storageService.getAllRawPayloads().catch((error) => {
      void this.notifyEvent(SyncEvent.DatabaseReadError, error)
      throw error
    })
  }

  private async processItemsKeysFirstDuringDatabaseLoad(
    itemsKeysPayloads: FullyFormedPayloadInterface[],
  ): Promise<void> {
    const encryptedItemsKeysPayloads = itemsKeysPayloads.filter(isEncryptedPayload)

    const originallyDecryptedItemsKeysPayloads = itemsKeysPayloads.filter(
      isDecryptedPayload,
    ) as DecryptedPayloadInterface<ItemsKeyContent>[]

    const itemsKeysSplit: Encryption.KeyedDecryptionSplit = {
      usesRootKeyWithKeyLookup: {
        items: encryptedItemsKeysPayloads,
      },
    }

    const newlyDecryptedItemsKeys = await this.protocolService.decryptSplit(itemsKeysSplit)

    await this.payloadManager.emitPayloads(
      [...originallyDecryptedItemsKeysPayloads, ...newlyDecryptedItemsKeys],
      PayloadEmitSource.LocalDatabaseLoaded,
    )
  }

  /**
   * @param rawPayloads - use `getDatabasePayloads` to get these payloads.
   * They are fed as a parameter so that callers don't have to await the loading, but can
   * await getting the raw payloads from storage
   */
  public async loadDatabasePayloads(rawPayloads: FullyFormedTransferPayload[]): Promise<void> {
    if (this.databaseLoaded) {
      throw 'Attempting to initialize already initialized local database.'
    }

    if (rawPayloads.length === 0) {
      this.databaseLoaded = true
      this.opStatus.setDatabaseLoadStatus(0, 0, true)
      return
    }

    const unsortedPayloads = rawPayloads
      .map((rawPayload) => {
        try {
          return CreatePayload(rawPayload, PayloadSource.Constructor)
        } catch (e) {
          console.error('Creating payload fail+ed', e)
          return undefined
        }
      })
      .filter(isNotUndefined)

    const payloads = SortPayloadsByRecentAndContentPriority(unsortedPayloads, this.localLoadPriorty)

    const itemsKeysPayloads = payloads.filter((payload) => {
      return payload.content_type === ContentType.ItemsKey
    })

    subtractFromArray(payloads, itemsKeysPayloads)

    await this.processItemsKeysFirstDuringDatabaseLoad(itemsKeysPayloads)

    /**
     * Map in batches to give interface a chance to update. Note that total decryption
     * time is constant regardless of batch size. Decrypting 3000 items all at once or in
     * batches will result in the same time spent. It's the emitting/painting/rendering
     * that requires batch size optimization.
     */
    const payloadCount = payloads.length
    const batchSize = this.options.loadBatchSize
    const numBatches = Math.ceil(payloadCount / batchSize)

    for (let batchIndex = 0; batchIndex < numBatches; batchIndex++) {
      const currentPosition = batchIndex * batchSize
      const batch = payloads.slice(currentPosition, currentPosition + batchSize)
      const encrypted: EncryptedPayloadInterface[] = []
      const nonencrypted: (DecryptedPayloadInterface | DeletedPayloadInterface)[] = []

      for (const payload of batch) {
        if (isEncryptedPayload(payload)) {
          encrypted.push(payload)
        } else {
          nonencrypted.push(payload)
        }
      }

      const split: Encryption.KeyedDecryptionSplit = {
        usesItemsKeyWithKeyLookup: {
          items: encrypted,
        },
      }

      const results = await this.protocolService.decryptSplit(split)

      await this.payloadManager.emitPayloads([...nonencrypted, ...results], PayloadEmitSource.LocalDatabaseLoaded)

      void this.notifyEvent(SyncEvent.LocalDataIncrementalLoad)

      this.opStatus.setDatabaseLoadStatus(currentPosition, payloadCount, false)

      await sleep(1, false)
    }

    this.databaseLoaded = true
    this.opStatus.setDatabaseLoadStatus(0, 0, true)
  }

  private setLastSyncToken(token: string) {
    this.syncToken = token
    return this.storageService.setValue(StorageKey.LastSyncToken, token)
  }

  private async setPaginationToken(token: string) {
    this.cursorToken = token
    if (token) {
      return this.storageService.setValue(StorageKey.PaginationToken, token)
    } else {
      return this.storageService.removeValue(StorageKey.PaginationToken)
    }
  }

  private async getLastSyncToken(): Promise<string> {
    if (!this.syncToken) {
      this.syncToken = (await this.storageService.getValue(StorageKey.LastSyncToken)) as string
    }
    return this.syncToken
  }

  private async getPaginationToken(): Promise<string> {
    if (!this.cursorToken) {
      this.cursorToken = (await this.storageService.getValue(StorageKey.PaginationToken)) as string
    }
    return this.cursorToken
  }

  private async clearSyncPositionTokens() {
    this.syncToken = undefined
    this.cursorToken = undefined
    await this.storageService.removeValue(StorageKey.LastSyncToken)
    await this.storageService.removeValue(StorageKey.PaginationToken)
  }

  private itemsNeedingSync() {
    return this.itemManager.getDirtyItems()
  }

  public async markAllItemsAsNeedingSyncAndPersist(): Promise<void> {
    this.log('Marking all items as needing sync')

    const items = this.itemManager.items
    const payloads = items.map((item) => {
      return new DecryptedPayload({
        ...item.payload.ejected(),
        dirty: true,
        dirtyIndex: getIncrementedDirtyIndex(),
      })
    })

    await this.payloadManager.emitPayloads(payloads, PayloadEmitSource.LocalChanged)
    await this.persistPayloads(payloads)
  }

  /**
   * Return the payloads that need local persistence, before beginning a sync.
   * This way, if the application is closed before a sync request completes,
   * pending data will be saved to disk, and synced the next time the app opens.
   */
  private popPayloadsNeedingPreSyncSave(from: (DecryptedPayloadInterface | DeletedPayloadInterface)[]) {
    const lastPreSyncSave = this.dirtyIndexAtLastPresyncSave
    if (lastPreSyncSave == undefined) {
      return from
    }

    const payloads = from.filter((candidate) => {
      return !candidate.dirtyIndex || candidate.dirtyIndex > lastPreSyncSave
    })

    this.dirtyIndexAtLastPresyncSave = getCurrentDirtyIndex()

    return payloads
  }

  private queueStrategyResolveOnNext(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.resolveQueue.push({ resolve, reject })
    })
  }

  private queueStrategyForceSpawnNew(options: SyncOptions) {
    return new Promise((resolve, reject) => {
      this.spawnQueue.push({ resolve, reject, options })
    })
  }

  /**
   * For timing strategy SyncQueueStrategy.ForceSpawnNew, we will execute a whole sync request
   * and pop it from the queue.
   */
  private popSpawnQueue() {
    if (this.spawnQueue.length === 0) {
      return null
    }

    const promise = this.spawnQueue[0]
    removeFromIndex(this.spawnQueue, 0)
    this.log('Syncing again from spawn queue')

    return this.sync({
      queueStrategy: SyncQueueStrategy.ForceSpawnNew,
      source: SyncSource.SpawnQueue,
      ...promise.options,
    })
      .then(() => {
        promise.resolve()
      })
      .catch(() => {
        promise.reject()
      })
  }

  private async payloadsByPreparingForServer(
    payloads: (DecryptedPayloadInterface | DeletedPayloadInterface)[],
  ): Promise<ServerSyncPushContextualPayload[]> {
    const payloadSplit = CreatePayloadSplit(payloads)

    const encryptionSplit = Encryption.SplitPayloadsByEncryptionType(payloadSplit.decrypted)

    const keyLookupSplit = Encryption.CreateEncryptionSplitWithKeyLookup(encryptionSplit)

    const encryptedResults = await this.protocolService.encryptSplit(keyLookupSplit)

    const contextPayloads = [
      ...encryptedResults.map(CreateEncryptedServerSyncPushPayload),
      ...payloadSplit.deleted.map(CreateDeletedServerSyncPushPayload),
    ]

    return contextPayloads
  }

  public async downloadFirstSync(waitTimeOnFailureMs: number, otherSyncOptions?: Partial<SyncOptions>): Promise<void> {
    const maxTries = 5

    for (let i = 0; i < maxTries; i++) {
      await this.sync({
        mode: SyncMode.DownloadFirst,
        queueStrategy: SyncQueueStrategy.ForceSpawnNew,
        source: SyncSource.External,
        ...otherSyncOptions,
      }).catch(console.error)

      if (this.completedOnlineDownloadFirstSync) {
        return
      } else {
        await sleep(waitTimeOnFailureMs)
      }
    }

    console.error(`Failed downloadFirstSync after ${maxTries} tries`)
  }

  public async awaitCurrentSyncs(): Promise<void> {
    await this.lastSyncInvokationPromise
    await this.currentSyncRequestPromise
  }

  public async sync(options: Partial<SyncOptions> = {}): Promise<unknown> {
    if (this.clientLocked) {
      this.log('Sync locked by client')
      return
    }

    const fullyResolvedOptions: SyncOptions = {
      source: SyncSource.External,
      ...options,
    }

    this.lastSyncInvokationPromise = this.performSync(fullyResolvedOptions)
    return this.lastSyncInvokationPromise
  }

  private async prepareForSync(options: SyncOptions) {
    const items = this.itemsNeedingSync()

    /**
     * Freeze the begin date immediately after getting items needing sync. This way an
     * item dirtied at any point after this date is marked as needing another sync
     */
    const beginDate = new Date()
    const frozenDirtyIndex = getCurrentDirtyIndex()

    /**
     * Items that have never been synced and marked as deleted should not be
     * uploaded to server, and instead deleted directly after sync completion.
     */
    const neverSyncedDeleted: DeletedItemInterface[] = items.filter((item) => {
      return item.neverSynced && isDeletedItem(item)
    }) as DeletedItemInterface[]

    subtractFromArray(items, neverSyncedDeleted)

    const decryptedPayloads = items.map((item) => {
      return item.payloadRepresentation()
    })

    const payloadsNeedingSave = this.popPayloadsNeedingPreSyncSave(decryptedPayloads)

    await this.persistPayloads(payloadsNeedingSave)

    if (options.onPresyncSave) {
      options.onPresyncSave()
    }

    return { items, beginDate, frozenDirtyIndex, neverSyncedDeleted }
  }

  /**
   * Allows us to lock this function from triggering duplicate network requests.
   * There are two types of locking checks:
   * 1. syncLocked(): If a call to sync() call has begun preparing to be sent to the server.
   *                  but not yet completed all the code below before reaching that point.
   *                  (before reaching opStatus.setDidBegin).
   * 2. syncOpInProgress: If a sync() call is in flight to the server.
   */
  private configureSyncLock() {
    const syncInProgress = this.opStatus.syncInProgress
    const databaseLoaded = this.databaseLoaded
    const canExecuteSync = !this.syncLock
    const shouldExecuteSync = canExecuteSync && databaseLoaded && !syncInProgress

    if (shouldExecuteSync) {
      this.syncLock = true
    } else {
      this.log(
        !canExecuteSync
          ? 'Another function call has begun preparing for sync.'
          : syncInProgress
          ? 'Attempting to sync while existing sync in progress.'
          : 'Attempting to sync before local database has loaded.',
      )
    }

    const releaseLock = () => {
      this.syncLock = false
    }

    return { shouldExecuteSync, releaseLock }
  }

  private deferSyncRequest(options: SyncOptions) {
    const useStrategy = !isNullOrUndefined(options.queueStrategy)
      ? options.queueStrategy
      : SyncQueueStrategy.ResolveOnNext

    if (useStrategy === SyncQueueStrategy.ResolveOnNext) {
      return this.queueStrategyResolveOnNext()
    } else if (useStrategy === SyncQueueStrategy.ForceSpawnNew) {
      return this.queueStrategyForceSpawnNew({
        mode: options.mode,
        checkIntegrity: options.checkIntegrity,
        source: options.source,
      })
    } else {
      throw Error(`Unhandled timing strategy ${useStrategy}`)
    }
  }

  private async prepareForSyncExecution(
    items: (DecryptedItemInterface | DeletedItemInterface)[],
    inTimeResolveQueue: SyncPromise[],
    beginDate: Date,
    frozenDirtyIndex: number,
  ) {
    this.opStatus.setDidBegin()

    await this.notifyEvent(SyncEvent.SyncWillBegin)

    /**
     * Subtract from array as soon as we're sure they'll be called.
     * resolves are triggered at the end of this function call
     */
    subtractFromArray(this.resolveQueue, inTimeResolveQueue)

    /**
     * lastSyncBegan must be set *after* any point we may have returned above.
     * Setting this value means the item was 100% sent to the server.
     */
    if (items.length > 0) {
      return this.itemManager.setLastSyncBeganForItems(items, beginDate, frozenDirtyIndex)
    } else {
      return items
    }
  }

  /**
   * The InTime resolve queue refers to any sync requests that were made while we still
   * have not sent out the current request. So, anything in the InTime resolve queue
   * will have made it "in time" to piggyback on the current request. Anything that comes
   * after InTime will schedule a new sync request.
   */
  private getPendingRequestsMadeInTimeToPiggyBackOnCurrentRequest() {
    return this.resolveQueue.slice()
  }

  private getOfflineSyncParameters(
    payloads: (DecryptedPayloadInterface | DeletedPayloadInterface)[],
    mode: SyncMode = SyncMode.Default,
  ): {
    uploadPayloads: (DecryptedPayloadInterface | DeletedPayloadInterface)[]
  } {
    const uploadPayloads: (DecryptedPayloadInterface | DeletedPayloadInterface)[] =
      mode === SyncMode.Default ? payloads : []

    return { uploadPayloads }
  }

  private createOfflineSyncOperation(
    payloads: (DeletedPayloadInterface | DecryptedPayloadInterface)[],
    source: SyncSource,
    mode: SyncMode = SyncMode.Default,
  ) {
    this.log('Syncing offline user', 'source:', source, 'mode:', mode, 'payloads:', payloads)

    const operation = new OfflineSyncOperation(payloads, async (type, response) => {
      if (this.dealloced) {
        return
      }
      if (type === SyncSignal.Response && response) {
        await this.handleOfflineResponse(response)
      }
    })

    return operation
  }

  private async getOnlineSyncParameters(
    payloads: (DecryptedPayloadInterface | DeletedPayloadInterface)[],
    mode: SyncMode = SyncMode.Default,
  ): Promise<{
    uploadPayloads: ServerSyncPushContextualPayload[]
    syncMode: SyncMode
  }> {
    const useMode = !this.completedOnlineDownloadFirstSync ? SyncMode.DownloadFirst : mode

    if (useMode === SyncMode.Default && !this.completedOnlineDownloadFirstSync) {
      throw Error('Attempting to default mode sync without having completed initial.')
    }

    const uploadPayloads: ServerSyncPushContextualPayload[] =
      useMode === SyncMode.Default ? await this.payloadsByPreparingForServer(payloads) : []

    return { uploadPayloads, syncMode: useMode }
  }

  private async createServerSyncOperation(
    payloads: ServerSyncPushContextualPayload[],
    checkIntegrity: boolean,
    source: SyncSource,
    mode: SyncMode = SyncMode.Default,
  ) {
    const syncToken = await this.getLastSyncToken()
    const paginationToken = await this.getPaginationToken()

    const operation = new AccountSyncOperation(
      payloads,
      async (type: SyncSignal, response?: ServerSyncResponse, stats?: SyncStats) => {
        switch (type) {
          case SyncSignal.Response:
            if (this.dealloced) {
              return
            }
            if (response?.hasError) {
              this.handleErrorServerResponse(response)
            } else if (response) {
              await this.handleSuccessServerResponse(operation, response)
            }
            break
          case SyncSignal.StatusChanged:
            if (stats) {
              this.opStatus.setUploadStatus(stats.completedUploadCount, stats.totalUploadCount)
            }
            break
        }
      },
      syncToken,
      paginationToken,
      this.apiService,
    )

    this.log(
      'Syncing online user',
      'source',
      SyncSource[source],
      'operation id',
      operation.id,
      'integrity check',
      checkIntegrity,
      'mode',
      SyncMode[mode],
      'syncToken',
      syncToken,
      'cursorToken',
      paginationToken,
      'payloads',
      payloads,
    )

    return operation
  }

  private async createSyncOperation(
    payloads: (DecryptedPayloadInterface | DeletedPayloadInterface)[],
    online: boolean,
    options: SyncOptions,
  ): Promise<{ operation: AccountSyncOperation | OfflineSyncOperation; mode: SyncMode }> {
    if (online) {
      const { uploadPayloads, syncMode } = await this.getOnlineSyncParameters(payloads, options.mode)

      return {
        operation: await this.createServerSyncOperation(
          uploadPayloads,
          useBoolean(options.checkIntegrity, false),
          options.source,
          syncMode,
        ),
        mode: syncMode,
      }
    } else {
      const { uploadPayloads } = this.getOfflineSyncParameters(payloads, options.mode)

      return {
        operation: this.createOfflineSyncOperation(uploadPayloads, options.source, options.mode),
        mode: options.mode || SyncMode.Default,
      }
    }
  }

  private async performSync(options: SyncOptions): Promise<unknown> {
    const { shouldExecuteSync, releaseLock } = this.configureSyncLock()

    const { items, beginDate, frozenDirtyIndex, neverSyncedDeleted } = await this.prepareForSync(options)

    const inTimeResolveQueue = this.getPendingRequestsMadeInTimeToPiggyBackOnCurrentRequest()

    if (!shouldExecuteSync) {
      return this.deferSyncRequest(options)
    }

    if (this.dealloced) {
      return
    }

    const latestItems = await this.prepareForSyncExecution(items, inTimeResolveQueue, beginDate, frozenDirtyIndex)

    const online = this.sessionManager.online()

    const { operation, mode: syncMode } = await this.createSyncOperation(
      latestItems.map((i) => i.payloadRepresentation()),
      online,
      options,
    )

    const operationPromise = operation.run()

    this.currentSyncRequestPromise = operationPromise

    await operationPromise

    if (this.dealloced) {
      return
    }

    releaseLock()

    const { hasError } = await this.handleSyncOperationFinish(operation, options, neverSyncedDeleted, syncMode)
    if (hasError) {
      return
    }

    const didSyncAgain = await this.potentiallySyncAgainAfterSyncCompletion(
      syncMode,
      options,
      inTimeResolveQueue,
      online,
    )
    if (didSyncAgain) {
      return
    }

    if (options.checkIntegrity) {
      await this.notifyEventSync(SyncEvent.SyncRequestsIntegrityCheck, {
        source: options.source as SyncSource,
      })
    }

    await this.notifyEventSync(SyncEvent.SyncCompletedWithAllItemsUploadedAndDownloaded, {
      source: options.source,
    })

    this.resolvePendingSyncRequestsThatMadeItInTimeOfCurrentRequest(inTimeResolveQueue)

    return undefined
  }

  private async handleOfflineResponse(response: OfflineSyncResponse) {
    this.log('Offline Sync Response', response)

    const masterCollection = this.payloadManager.getMasterCollection()

    const delta = new DeltaOfflineSaved(masterCollection, response.savedPayloads)

    const emit = delta.result()

    const payloadsToPersist = await this.payloadManager.emitDeltaEmit(emit)

    await this.persistPayloads(payloadsToPersist)

    this.opStatus.clearError()

    await this.notifyEvent(SyncEvent.SingleRoundTripSyncCompleted, response)
  }

  private handleErrorServerResponse(response: ServerSyncResponse) {
    this.log('Sync Error', response)

    if (response.status === INVALID_SESSION_RESPONSE_STATUS) {
      void this.notifyEvent(SyncEvent.InvalidSession)
    }

    this.opStatus?.setError(response.error)

    void this.notifyEvent(SyncEvent.SyncError, response)
  }

  private async handleSuccessServerResponse(operation: AccountSyncOperation, response: ServerSyncResponse) {
    if (this._simulate_latency) {
      await sleep(this._simulate_latency.latency)
    }

    this.opStatus.clearError()

    this.opStatus.setDownloadStatus(response.retrievedPayloads.length)

    const masterCollection = this.payloadManager.getMasterCollection()

    const historyMap = this.historyService.getHistoryMapCopy()

    const resolver = new ServerSyncResponseResolver(
      {
        retrievedPayloads: await this.processServerPayloads(response.retrievedPayloads, PayloadSource.RemoteRetrieved),
        savedPayloads: response.savedPayloads,
        uuidConflictPayloads: await this.processServerPayloads(
          response.uuidConflictPayloads,
          PayloadSource.RemoteRetrieved,
        ),
        dataConflictPayloads: await this.processServerPayloads(
          response.dataConflictPayloads,
          PayloadSource.RemoteRetrieved,
        ),
        rejectedPayloads: await this.processServerPayloads(response.rejectedPayloads, PayloadSource.RemoteRetrieved),
      },
      masterCollection,
      operation.payloadsSavedOrSaving,
      historyMap,
    )

    this.log(
      'Online Sync Response',
      'Operator ID',
      operation.id,
      response.rawResponse.data,
      'Decrypted payloads',
      resolver['payloadSet'],
    )

    const emits = resolver.result()

    for (const emit of emits) {
      const payloadsToPersist = await this.payloadManager.emitDeltaEmit(emit)

      await this.persistPayloads(payloadsToPersist)
    }

    await Promise.all([
      this.setLastSyncToken(response.lastSyncToken as string),
      this.setPaginationToken(response.paginationToken as string),
      this.notifyEvent(SyncEvent.SingleRoundTripSyncCompleted, response),
    ])
  }

  private async processServerPayloads(
    items: FilteredServerItem[],
    source: PayloadSource,
  ): Promise<FullyFormedPayloadInterface[]> {
    const payloads = items.map((i) => CreatePayloadFromRawServerItem(i, source))

    const { encrypted, deleted } = CreateNonDecryptedPayloadSplit(payloads)

    const results: FullyFormedPayloadInterface[] = [...deleted]

    const { rootKeyEncryption, itemsKeyEncryption } = SplitPayloadsByEncryptionType(encrypted)

    const { results: rootKeyDecryptionResults, map: processedItemsKeys } = await this.decryptServerItemsKeys(
      rootKeyEncryption || [],
    )

    extendArray(results, rootKeyDecryptionResults)

    if (itemsKeyEncryption) {
      const decryptionResults = await this.decryptProcessedServerPayloads(itemsKeyEncryption, processedItemsKeys)
      extendArray(results, decryptionResults)
    }

    return results
  }

  private async decryptServerItemsKeys(payloads: EncryptedPayloadInterface[]) {
    const map: Record<UuidString, DecryptedPayloadInterface<ItemsKeyContent>> = {}

    if (payloads.length === 0) {
      return {
        results: [],
        map,
      }
    }

    const rootKeySplit: KeyedDecryptionSplit = {
      usesRootKeyWithKeyLookup: {
        items: payloads,
      },
    }

    const results = await this.protocolService.decryptSplit<ItemsKeyContent>(rootKeySplit)

    results.forEach((result) => {
      if (isDecryptedPayload<ItemsKeyContent>(result) && result.content_type === ContentType.ItemsKey) {
        map[result.uuid] = result
      }
    })

    return {
      results,
      map,
    }
  }

  private async decryptProcessedServerPayloads(
    payloads: EncryptedPayloadInterface[],
    map: Record<UuidString, DecryptedPayloadInterface<ItemsKeyContent>>,
  ): Promise<(EncryptedPayloadInterface | DecryptedPayloadInterface)[]> {
    return Promise.all(
      payloads.map(async (encrypted) => {
        const previouslyProcessedItemsKey: DecryptedPayloadInterface<ItemsKeyContent> | undefined =
          map[encrypted.items_key_id as string]

        const itemsKey = previouslyProcessedItemsKey
          ? (CreateDecryptedItemFromPayload(previouslyProcessedItemsKey) as ItemsKeyInterface)
          : undefined

        const keyedSplit: Encryption.KeyedDecryptionSplit = {}
        if (itemsKey) {
          keyedSplit.usesItemsKey = {
            items: [encrypted],
            key: itemsKey,
          }
        } else {
          keyedSplit.usesItemsKeyWithKeyLookup = {
            items: [encrypted],
          }
        }

        return this.protocolService.decryptSplitSingle(keyedSplit)
      }),
    )
  }

  private async handleSyncOperationFinish(
    operation: AccountSyncOperation | OfflineSyncOperation,
    options: SyncOptions,
    neverSyncedDeleted: DeletedItemInterface[],
    syncMode: SyncMode,
  ) {
    this.opStatus.setDidEnd()

    if (this.opStatus.hasError()) {
      return { hasError: true }
    }

    this.opStatus.reset()

    this.lastSyncDate = new Date()

    if (operation instanceof AccountSyncOperation && operation.numberOfItemsInvolved >= this.majorChangeThreshold) {
      void this.notifyEvent(SyncEvent.MajorDataChange)
    }

    if (neverSyncedDeleted.length > 0) {
      await this.handleNeverSyncedDeleted(neverSyncedDeleted)
    }

    if (syncMode !== SyncMode.DownloadFirst) {
      await this.notifyEvent(SyncEvent.SyncCompletedWithAllItemsUploaded, {
        source: options.source,
      })
    }

    return { hasError: false }
  }

  private async handleDownloadFirstCompletionAndSyncAgain(online: boolean, options: SyncOptions) {
    if (online) {
      this.completedOnlineDownloadFirstSync = true
    }
    await this.notifyEvent(SyncEvent.DownloadFirstSyncCompleted)
    await this.sync({
      source: SyncSource.AfterDownloadFirst,
      checkIntegrity: true,
      awaitAll: options.awaitAll,
    })
  }

  private async syncAgainByHandlingRequestsWaitingInResolveQueue(options: SyncOptions) {
    this.log('Syncing again from resolve queue')
    const promise = this.sync({
      source: SyncSource.ResolveQueue,
      checkIntegrity: options.checkIntegrity,
    })
    if (options.awaitAll) {
      await promise
    }
  }

  /**
   * As part of the just concluded sync operation, more items may have
   * been dirtied (like conflicts), and the caller may want to await the
   * full resolution of these items.
   */
  private async syncAgainByHandlingNewDirtyItems(options: SyncOptions) {
    await this.sync({
      source: SyncSource.MoreDirtyItems,
      checkIntegrity: options.checkIntegrity,
      awaitAll: options.awaitAll,
    })
  }

  /**
   * For timing strategy SyncQueueStrategy.ResolveOnNext.
   * Execute any callbacks pulled before this sync request began.
   * Calling resolve on the callbacks should be the last thing we do in this function,
   * to simulate calling .sync as if it went through straight to the end without having
   * to be queued.
   */
  private resolvePendingSyncRequestsThatMadeItInTimeOfCurrentRequest(inTimeResolveQueue: SyncPromise[]) {
    for (const callback of inTimeResolveQueue) {
      callback.resolve()
    }
  }

  private async potentiallySyncAgainAfterSyncCompletion(
    syncMode: SyncMode,
    options: SyncOptions,
    inTimeResolveQueue: SyncPromise[],
    online: boolean,
  ) {
    if (syncMode === SyncMode.DownloadFirst) {
      await this.handleDownloadFirstCompletionAndSyncAgain(online, options)
      this.resolvePendingSyncRequestsThatMadeItInTimeOfCurrentRequest(inTimeResolveQueue)
      return true
    }

    const didSpawnNewRequest = this.popSpawnQueue()
    const resolveQueueHasRequestsThatDidntMakeItInTime = this.resolveQueue.length > 0
    if (!didSpawnNewRequest && resolveQueueHasRequestsThatDidntMakeItInTime) {
      await this.syncAgainByHandlingRequestsWaitingInResolveQueue(options)
      this.resolvePendingSyncRequestsThatMadeItInTimeOfCurrentRequest(inTimeResolveQueue)
      return true
    }

    const newItemsNeedingSync = this.itemsNeedingSync()
    if (newItemsNeedingSync.length > 0) {
      await this.syncAgainByHandlingNewDirtyItems(options)
      this.resolvePendingSyncRequestsThatMadeItInTimeOfCurrentRequest(inTimeResolveQueue)
      return true
    }

    return false
  }

  /**
   * Items that have never been synced and marked as deleted should be cleared
   * as dirty, mapped, then removed from storage.
   */
  private async handleNeverSyncedDeleted(items: DeletedItemInterface[]) {
    const payloads = items.map((item) => {
      return item.payloadRepresentation({
        dirty: false,
      })
    })

    await this.payloadManager.emitPayloads(payloads, PayloadEmitSource.LocalChanged)
    await this.persistPayloads(payloads)
  }

  public async persistPayloads(payloads: FullyFormedPayloadInterface[]) {
    if (payloads.length === 0 || this.dealloced) {
      return
    }

    return this.storageService.savePayloads(payloads).catch((error) => {
      void this.notifyEvent(SyncEvent.DatabaseWriteError, error)
      SNLog.error(error)
    })
  }

  setInSync(isInSync: boolean): void {
    if (isInSync === !this.outOfSync) {
      return
    }

    if (isInSync) {
      this.outOfSync = false
      void this.notifyEvent(SyncEvent.ExitOutOfSync)
    } else {
      this.outOfSync = true
      void this.notifyEvent(SyncEvent.EnterOutOfSync)
    }
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === IntegrityEvent.IntegrityCheckCompleted) {
      await this.handleIntegrityCheckEventResponse(event.payload as IntegrityEventPayload)
    }
  }

  private async handleIntegrityCheckEventResponse(eventPayload: IntegrityEventPayload) {
    const rawPayloads = eventPayload.rawPayloads

    if (rawPayloads.length === 0) {
      this.setInSync(true)
      return
    }

    const receivedPayloads = FilterDisallowedRemotePayloadsAndMap(rawPayloads).map((rawPayload) => {
      return CreatePayloadFromRawServerItem(rawPayload, PayloadSource.RemoteRetrieved)
    })

    const payloadSplit = CreateNonDecryptedPayloadSplit(receivedPayloads)

    const encryptionSplit = Encryption.SplitPayloadsByEncryptionType(payloadSplit.encrypted)

    const keyedSplit = Encryption.CreateDecryptionSplitWithKeyLookup(encryptionSplit)

    const decryptionResults = await this.protocolService.decryptSplit(keyedSplit)

    this.setInSync(false)

    await this.emitOutOfSyncRemotePayloads([...decryptionResults, ...payloadSplit.deleted])

    const shouldCheckIntegrityAgainAfterSync = eventPayload.source !== SyncSource.ResolveOutOfSync

    await this.sync({
      checkIntegrity: shouldCheckIntegrityAgainAfterSync,
      source: SyncSource.ResolveOutOfSync,
    })
  }

  private async emitOutOfSyncRemotePayloads(payloads: FullyFormedPayloadInterface[]) {
    const delta = new DeltaOutOfSync(
      this.payloadManager.getMasterCollection(),
      ImmutablePayloadCollection.WithPayloads(payloads),
      this.historyService.getHistoryMapCopy(),
    )

    const emit = delta.result()

    await this.payloadManager.emitDeltaEmit(emit)

    await this.persistPayloads(emit.emits)
  }

  override async getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    const dirtyUuids = Uuids(this.itemsNeedingSync())

    return {
      sync: {
        syncToken: await this.getLastSyncToken(),
        cursorToken: await this.getPaginationToken(),
        dirtyIndexAtLastPresyncSave: this.dirtyIndexAtLastPresyncSave,
        lastSyncDate: this.lastSyncDate,
        outOfSync: this.outOfSync,
        completedOnlineDownloadFirstSync: this.completedOnlineDownloadFirstSync,
        clientLocked: this.clientLocked,
        databaseLoaded: this.databaseLoaded,
        syncLock: this.syncLock,
        dealloced: this.dealloced,
        itemsNeedingSync: dirtyUuids,
        itemsNeedingSyncCount: dirtyUuids.length,
        pendingRequestCount: this.resolveQueue.length + this.spawnQueue.length,
      },
    }
  }

  /** @e2e_testing */
  // eslint-disable-next-line camelcase
  ut_setDatabaseLoaded(loaded: boolean): void {
    this.databaseLoaded = loaded
  }

  /** @e2e_testing */
  // eslint-disable-next-line camelcase
  ut_clearLastSyncDate(): void {
    this.lastSyncDate = undefined
  }

  /** @e2e_testing */
  // eslint-disable-next-line camelcase
  ut_beginLatencySimulator(latency: number): void {
    this._simulate_latency = {
      latency: latency || 1000,
      enabled: true,
    }
  }

  /** @e2e_testing */
  // eslint-disable-next-line camelcase
  ut_endLatencySimulator(): void {
    this._simulate_latency = undefined
  }
}
