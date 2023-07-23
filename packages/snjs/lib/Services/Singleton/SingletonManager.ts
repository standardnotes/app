import { PayloadManager } from './../Payloads/PayloadManager'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import {
  DecryptedItemInterface,
  DecryptedPayload,
  SingletonStrategy,
  ItemContent,
  PredicateInterface,
  PayloadEmitSource,
  PayloadTimestampDefaults,
  getIncrementedDirtyIndex,
  Predicate,
} from '@standardnotes/models'
import { arrayByRemovingFromIndex, extendArray, UuidGenerator } from '@standardnotes/utils'
import { SyncService } from '../Sync/SyncService'
import {
  AbstractService,
  InternalEventBusInterface,
  MutatorClientInterface,
  SingletonManagerInterface,
  SyncEvent,
} from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

/**
 * The singleton manager allow consumers to ensure that only 1 item exists of a certain
 * predicate. For example, consumers may want to ensure that only one item of contentType
 * UserPreferences exist. The singleton manager allows consumers to do this via 2 methods:
 * 1. Consumers may use `findOrCreateContentTypeSingleton` to retrieve an item if it exists, or create
 *    it otherwise. While this method may serve most cases, it does not allow the consumer
 *    to subscribe to changes, such as if after this method is called, a UserPreferences object
 *    is downloaded from a remote source.
 * 2. Items can override isSingleton, singletonPredicate, and strategyWhenConflictingWithItem (optional)
 *    to automatically gain singleton resolution.
 */
export class SingletonManager extends AbstractService implements SingletonManagerInterface {
  private resolveQueue: DecryptedItemInterface[] = []

  private removeItemObserver!: () => void
  private removeSyncObserver!: () => void

  constructor(
    private itemManager: ItemManager,
    private mutator: MutatorClientInterface,
    private payloadManager: PayloadManager,
    private sync: SyncService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.addObservers()
  }

  public override deinit(): void {
    ;(this.sync as unknown) = undefined
    ;(this.mutator as unknown) = undefined
    ;(this.itemManager as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined

    this.resolveQueue.length = 0

    this.removeItemObserver()
    ;(this.removeItemObserver as unknown) = undefined

    this.removeSyncObserver()
    ;(this.removeSyncObserver as unknown) = undefined

    super.deinit()
  }

  private popResolveQueue() {
    const queue = this.resolveQueue.slice()
    this.resolveQueue = []
    return queue
  }

  /**
   * We only want to resolve singletons for items that are newly created (because this
   * is when items proliferate). However, we don't want to resolve immediately on creation,
   * but instead wait for the next full sync to complete. This is so that when you download
   * a singleton and create the object, but the items key for the item has not yet been
   * downloaded, the singleton will be errorDecrypting, and would be mishandled in the
   * overall singleton logic. By waiting for a full sync to complete, we can be sure that
   * all items keys have been downloaded.
   */
  private addObservers() {
    this.removeItemObserver = this.itemManager.addObserver(ContentType.TYPES.Any, ({ inserted, unerrored }) => {
      if (unerrored.length > 0) {
        this.resolveQueue = this.resolveQueue.concat(unerrored)
      }

      if (inserted.length > 0) {
        this.resolveQueue = this.resolveQueue.concat(inserted)
      }
    })

    this.removeSyncObserver = this.sync.addEventObserver(async (eventName) => {
      if (
        eventName === SyncEvent.DownloadFirstSyncCompleted ||
        eventName === SyncEvent.SyncCompletedWithAllItemsUploaded
      ) {
        await this.resolveSingletonsForItems(this.popResolveQueue(), eventName)
      }
    })
  }

  private validItemsMatchingPredicate<T extends DecryptedItemInterface>(
    contentType: string,
    predicate: PredicateInterface<T>,
  ) {
    return this.itemManager.itemsMatchingPredicate(contentType, predicate)
  }

  private async resolveSingletonsForItems(items: DecryptedItemInterface[], eventSource: SyncEvent) {
    if (items.length === 0) {
      return
    }

    const handled: DecryptedItemInterface[] = []

    for (const item of items) {
      if (handled.includes(item) || !item.isSingleton) {
        continue
      }

      const matchingItems = this.validItemsMatchingPredicate<DecryptedItemInterface>(
        item.content_type,
        item.singletonPredicate(),
      )

      extendArray(handled, matchingItems || [])

      if (!matchingItems || matchingItems.length <= 1) {
        continue
      }

      await this.handleStrategy(matchingItems, item.singletonStrategy)
    }
    /**
     * Only sync if event source is SyncCompletedWithAllItemsUploaded.
     * If it is on DownloadFirstSyncCompleted, we don't need to sync,
     * as a sync request will automatically be made as part of the second phase
     * of a download-first request.
     */
    if (handled.length > 0 && eventSource === SyncEvent.SyncCompletedWithAllItemsUploaded) {
      await this.sync?.sync({ sourceDescription: 'Resolve singletons for items' })
    }
  }

  private async handleStrategy(items: DecryptedItemInterface[], strategy: SingletonStrategy) {
    if (strategy !== SingletonStrategy.KeepEarliest) {
      throw 'Unhandled singleton strategy'
    }

    const earliestFirst = items.sort((a, b) => {
      /** -1: a comes first, 1: b comes first */
      return a.created_at < b.created_at ? -1 : 1
    })

    const deleteItems = arrayByRemovingFromIndex(earliestFirst, 0)
    await this.mutator.setItemsToBeDeleted(deleteItems)
  }

  public findSingleton<T extends DecryptedItemInterface>(
    contentType: string,
    predicate: PredicateInterface<T>,
  ): T | undefined {
    const matchingItems = this.validItemsMatchingPredicate(contentType, predicate)
    if (matchingItems.length > 0) {
      return matchingItems[0] as T
    }
    return undefined
  }

  public async findOrCreateContentTypeSingleton<
    C extends ItemContent = ItemContent,
    T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(contentType: string, createContent: ItemContent): Promise<T> {
    const existingItems = this.itemManager.getItems<T>(contentType)

    if (existingItems.length > 0) {
      return existingItems[0]
    }

    /** Item not found, safe to create after full sync has completed */
    if (!this.sync.getLastSyncDate()) {
      /**
       * Add a temporary observer in case of long-running sync request, where
       * the item we're looking for ends up resolving early or in the middle.
       */
      let matchingItem: DecryptedItemInterface | undefined

      const removeObserver = this.itemManager.addObserver(contentType, ({ inserted }) => {
        if (inserted.length > 0) {
          const matchingItems = inserted.filter((i) => i.content_type === contentType)

          if (matchingItems.length > 0) {
            matchingItem = matchingItems[0]
          }
        }
      })

      await this.sync.sync({ sourceDescription: 'Find or create singleton, before any sync has completed' })

      removeObserver()

      if (matchingItem) {
        return matchingItem as T
      }

      /** Check again */
      const refreshedItems = this.itemManager.getItems<T>(contentType)
      if (refreshedItems.length > 0) {
        return refreshedItems[0] as T
      }
    }

    /** Delete any items that are errored */
    const errorDecrypting = this.payloadManager.erroredPayloadsForContentType(contentType)

    if (errorDecrypting.length) {
      await this.payloadManager.deleteErroredPayloads(errorDecrypting)
    }

    /** Safe to create */
    const dirtyPayload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: contentType,
      content: createContent,
      dirty: true,
      dirtyIndex: getIncrementedDirtyIndex(),
      ...PayloadTimestampDefaults(),
    })

    const item = await this.mutator.emitItemFromPayload(dirtyPayload, PayloadEmitSource.LocalInserted)

    void this.sync.sync({ sourceDescription: 'After find or create singleton' })

    return item as T
  }

  public async findOrCreateSingleton<
    C extends ItemContent = ItemContent,
    T extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(predicate: Predicate<T>, contentType: string, createContent: ItemContent): Promise<T> {
    const existingItems = this.itemManager.itemsMatchingPredicate<T>(contentType, predicate)
    if (existingItems.length > 0) {
      return existingItems[0]
    }

    /** Item not found, safe to create after full sync has completed */
    if (!this.sync.getLastSyncDate()) {
      /**
       * Add a temporary observer in case of long-running sync request, where
       * the item we're looking for ends up resolving early or in the middle.
       */
      let matchingItem: DecryptedItemInterface | undefined

      const removeObserver = this.itemManager.addObserver(contentType, ({ inserted }) => {
        if (inserted.length > 0) {
          const matchingItems = inserted.filter((i) => i.satisfiesPredicate(predicate))

          if (matchingItems.length > 0) {
            matchingItem = matchingItems[0]
          }
        }
      })

      await this.sync.sync({ sourceDescription: 'Find or create singleton, before any sync has completed' })

      removeObserver()

      if (matchingItem) {
        return matchingItem as T
      }

      /** Check again */
      const refreshedItems = this.itemManager.itemsMatchingPredicate<T>(contentType, predicate)
      if (refreshedItems.length > 0) {
        return refreshedItems[0] as T
      }
    }

    /** Safe to create */
    const dirtyPayload = new DecryptedPayload({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: contentType,
      content: createContent,
      dirty: true,
      dirtyIndex: getIncrementedDirtyIndex(),
      ...PayloadTimestampDefaults(),
    })

    const item = await this.mutator.emitItemFromPayload(dirtyPayload, PayloadEmitSource.LocalInserted)

    void this.sync.sync({ sourceDescription: 'After find or create singleton' })

    return item as T
  }
}
