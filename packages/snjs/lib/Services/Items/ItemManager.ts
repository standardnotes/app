import { ContentType, Uuid } from '@standardnotes/common'
import { assert, naturalSort, removeFromArray, UuidGenerator, Uuids } from '@standardnotes/utils'
import { ItemsKeyMutator, SNItemsKey } from '@standardnotes/encryption'
import { PayloadManager } from '../Payloads/PayloadManager'
import { TagsToFoldersMigrationApplicator } from '../../Migrations/Applicators/TagsToFolders'
import { UuidString } from '../../Types/UuidString'
import * as Models from '@standardnotes/models'
import * as Services from '@standardnotes/services'
import { PayloadManagerChangeData } from '../Payloads'
import { DiagnosticInfo, ItemsClientInterface } from '@standardnotes/services'
import { ApplicationDisplayOptions } from '@Lib/Application/Options/OptionalOptions'
import { CollectionSort, DecryptedItemInterface, ItemContent } from '@standardnotes/models'

type ItemsChangeObserver<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface> = {
  contentType: ContentType[]
  callback: Services.ItemManagerChangeObserverCallback<I>
}

/**
 * The item manager is backed by the payload manager. It listens for change events from the
 * global payload manager, and converts any payloads to items, then propagates those items to
 * listeners on the item manager. When the item manager makes a change to an item, it will modify
 * items using a mutator, then emit those payloads to the payload manager. The payload manager
 * will then notify its observers (which is us), we'll convert the payloads to items,
 * and then we'll propagate them to our listeners.
 */
export class ItemManager
  extends Services.AbstractService
  implements Services.ItemManagerInterface, ItemsClientInterface
{
  private unsubChangeObserver: () => void
  private observers: ItemsChangeObserver[] = []
  private collection!: Models.ItemCollection
  private systemSmartViews: Models.SmartView[]
  private tagItemsIndex!: Models.TagItemsIndex

  private navigationDisplayController!: Models.ItemDisplayController<Models.SNNote | Models.FileItem>
  private tagDisplayController!: Models.ItemDisplayController<Models.SNTag>
  private itemsKeyDisplayController!: Models.ItemDisplayController<SNItemsKey>
  private componentDisplayController!: Models.ItemDisplayController<Models.SNComponent>
  private themeDisplayController!: Models.ItemDisplayController<Models.SNTheme>
  private fileDisplayController!: Models.ItemDisplayController<Models.FileItem>
  private smartViewDisplayController!: Models.ItemDisplayController<Models.SmartView>

  constructor(
    private payloadManager: PayloadManager,
    private readonly options: ApplicationDisplayOptions = { supportsFileNavigation: false },
    protected override internalEventBus: Services.InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.payloadManager = payloadManager
    this.systemSmartViews = this.rebuildSystemSmartViews({})
    this.createCollection()
    this.unsubChangeObserver = this.payloadManager.addObserver(ContentType.Any, this.setPayloads.bind(this))
  }

  private rebuildSystemSmartViews(criteria: Models.FilterDisplayOptions): Models.SmartView[] {
    this.systemSmartViews = Models.BuildSmartViews(criteria, this.options)
    return this.systemSmartViews
  }

  private createCollection() {
    this.collection = new Models.ItemCollection()

    this.navigationDisplayController = new Models.ItemDisplayController(
      this.collection,
      [ContentType.Note, ContentType.File],
      {
        sortBy: 'created_at',
        sortDirection: 'dsc',
        hiddenContentTypes: !this.options.supportsFileNavigation ? [ContentType.File] : [],
      },
    )
    this.tagDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.Tag], {
      sortBy: 'title',
      sortDirection: 'asc',
    })
    this.itemsKeyDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.ItemsKey], {
      sortBy: 'created_at',
      sortDirection: 'asc',
    })
    this.componentDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.Component], {
      sortBy: 'created_at',
      sortDirection: 'asc',
    })
    this.themeDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.Theme], {
      sortBy: 'title',
      sortDirection: 'asc',
    })
    this.smartViewDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.SmartView], {
      sortBy: 'title',
      sortDirection: 'asc',
    })
    this.fileDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.File], {
      sortBy: 'title',
      sortDirection: 'asc',
    })

    this.tagItemsIndex = new Models.TagItemsIndex(this.collection, this.tagItemsIndex?.observers)
  }

  private get allDisplayControllers(): Models.ItemDisplayController<Models.DisplayItem>[] {
    return [
      this.navigationDisplayController,
      this.tagDisplayController,
      this.itemsKeyDisplayController,
      this.componentDisplayController,
      this.themeDisplayController,
      this.smartViewDisplayController,
      this.fileDisplayController,
    ]
  }

  get invalidItems(): Models.EncryptedItemInterface[] {
    return this.collection.invalidElements()
  }

  public createItemFromPayload(payload: Models.DecryptedPayloadInterface): Models.DecryptedItemInterface {
    return Models.CreateDecryptedItemFromPayload(payload)
  }

  public createPayloadFromObject(object: Models.DecryptedTransferPayload): Models.DecryptedPayloadInterface {
    return new Models.DecryptedPayload(object)
  }

  public setPrimaryItemDisplayOptions(options: Models.DisplayOptions): void {
    const override: Models.FilterDisplayOptions = {}

    if (options.views && options.views.find((view) => view.uuid === Models.SystemViewId.AllNotes)) {
      if (options.includeArchived === undefined) {
        override.includeArchived = false
      }
      if (options.includeTrashed === undefined) {
        override.includeTrashed = false
      }
    }
    if (options.views && options.views.find((view) => view.uuid === Models.SystemViewId.ArchivedNotes)) {
      if (options.includeTrashed === undefined) {
        override.includeTrashed = false
      }
    }
    if (options.views && options.views.find((view) => view.uuid === Models.SystemViewId.TrashedNotes)) {
      if (!options.includeArchived) {
        override.includeArchived = true
      }
    }

    this.rebuildSystemSmartViews({ ...options, ...override })

    const mostRecentVersionOfTags = options.tags
      ?.map((tag) => {
        return this.collection.find(tag.uuid) as Models.SNTag
      })
      .filter((tag) => tag != undefined)

    const mostRecentVersionOfViews = options.views
      ?.map((view) => {
        if (Models.isSystemView(view)) {
          return this.systemSmartViews.find((systemView) => systemView.uuid === view.uuid) as Models.SmartView
        }
        return this.collection.find(view.uuid) as Models.SmartView
      })
      .filter((view) => view != undefined)

    const updatedOptions: Models.DisplayOptions = {
      ...options,
      ...override,
      ...{
        tags: mostRecentVersionOfTags,
        views: mostRecentVersionOfViews,
      },
    }

    if (updatedOptions.sortBy === CollectionSort.Title) {
      updatedOptions.sortDirection = updatedOptions.sortDirection === 'asc' ? 'dsc' : 'asc'
    }

    this.navigationDisplayController.setDisplayOptions({
      customFilter: Models.computeUnifiedFilterForDisplayOptions(updatedOptions, this.collection),
      ...updatedOptions,
    })
  }

  public getDisplayableNotes(): Models.SNNote[] {
    assert(this.navigationDisplayController.contentTypes.length === 2)

    const fileContentTypeHidden = !this.options.supportsFileNavigation
    if (fileContentTypeHidden) {
      return this.navigationDisplayController.items() as Models.SNNote[]
    } else {
      return this.navigationDisplayController.items().filter(Models.isNote)
    }
  }

  public getDisplayableFiles(): Models.FileItem[] {
    return this.fileDisplayController.items()
  }

  public getDisplayableNotesAndFiles(): (Models.SNNote | Models.FileItem)[] {
    assert(this.options.supportsFileNavigation)
    return this.navigationDisplayController.items()
  }

  public getDisplayableTags(): Models.SNTag[] {
    return this.tagDisplayController.items()
  }

  public getDisplayableItemsKeys(): SNItemsKey[] {
    return this.itemsKeyDisplayController.items()
  }

  public getDisplayableComponents(): (Models.SNComponent | Models.SNTheme)[] {
    return [...this.componentDisplayController.items(), ...this.themeDisplayController.items()]
  }

  public override deinit(): void {
    this.unsubChangeObserver()
    ;(this.options as unknown) = undefined
    ;(this.unsubChangeObserver as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.collection as unknown) = undefined
    ;(this.tagItemsIndex as unknown) = undefined
    ;(this.tagDisplayController as unknown) = undefined
    ;(this.navigationDisplayController as unknown) = undefined
    ;(this.itemsKeyDisplayController as unknown) = undefined
    ;(this.componentDisplayController as unknown) = undefined
    ;(this.themeDisplayController as unknown) = undefined
    ;(this.fileDisplayController as unknown) = undefined
    ;(this.smartViewDisplayController as unknown) = undefined
  }

  resetState(): void {
    this.createCollection()
  }

  findItem<T extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(uuid: UuidString): T | undefined {
    const itemFromCollection = this.collection.findDecrypted<T>(uuid)

    return itemFromCollection || (this.findSystemSmartView(uuid) as T | undefined)
  }

  findAnyItem(uuid: UuidString): Models.ItemInterface | undefined {
    const itemFromCollection = this.collection.find(uuid)

    return itemFromCollection || this.findSystemSmartView(uuid)
  }

  findAnyItems(uuids: UuidString[]): Models.ItemInterface[] {
    return this.collection.findAll(uuids)
  }

  private findSystemSmartView(uuid: Uuid): Models.SmartView | undefined {
    return this.systemSmartViews.find((view) => view.uuid === uuid)
  }

  findSureItem<T extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(uuid: UuidString): T {
    return this.findItem(uuid) as T
  }

  /**
   * Returns all items matching given ids
   */
  findItems<T extends Models.DecryptedItemInterface>(uuids: UuidString[]): T[] {
    return this.collection.findAllDecrypted(uuids) as T[]
  }

  /**
   * If item is not found, an `undefined` element
   * will be inserted into the array.
   */
  findItemsIncludingBlanks<T extends Models.DecryptedItemInterface>(uuids: UuidString[]): (T | undefined)[] {
    return this.collection.findAllDecryptedWithBlanks(uuids) as (T | undefined)[]
  }

  public get items(): Models.DecryptedItemInterface[] {
    return this.collection.nondeletedElements().filter(Models.isDecryptedItem)
  }

  allTrackedItems(): Models.ItemInterface[] {
    return this.collection.all()
  }

  public hasTagsNeedingFoldersMigration(): boolean {
    return TagsToFoldersMigrationApplicator.isApplicableToCurrentData(this)
  }

  public addNoteCountChangeObserver(observer: Models.TagItemCountChangeObserver): () => void {
    return this.tagItemsIndex.addCountChangeObserver(observer)
  }

  public allCountableNotesCount(): number {
    return this.tagItemsIndex.allCountableItemsCount()
  }

  public countableNotesForTag(tag: Models.SNTag | Models.SmartView): number {
    if (tag instanceof Models.SmartView) {
      if (tag.uuid === Models.SystemViewId.AllNotes) {
        return this.tagItemsIndex.allCountableItemsCount()
      }

      throw Error('countableItemsForTag is not meant to be used for smart views.')
    }
    return this.tagItemsIndex.countableItemsForTag(tag)
  }

  public getNoteCount(): number {
    return this.noteCount
  }

  public addObserver<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(
    contentType: ContentType | ContentType[],
    callback: Services.ItemManagerChangeObserverCallback<I>,
  ): () => void {
    if (!Array.isArray(contentType)) {
      contentType = [contentType]
    }

    const observer: ItemsChangeObserver<I> = {
      contentType,
      callback,
    }

    this.observers.push(observer as ItemsChangeObserver)

    const thislessObservers = this.observers
    return () => {
      removeFromArray(thislessObservers, observer)
    }
  }

  /**
   * Returns the items that reference the given item, or an empty array if no results.
   */
  public itemsReferencingItem(
    itemToLookupUuidFor: Models.DecryptedItemInterface,
    contentType?: ContentType,
  ): Models.DecryptedItemInterface[] {
    const uuids = this.collection.uuidsThatReferenceUuid(itemToLookupUuidFor.uuid)
    let referencing = this.findItems(uuids)
    if (contentType) {
      referencing = referencing.filter((ref) => {
        return ref?.content_type === contentType
      })
    }
    return referencing
  }

  /**
   * Returns all items that an item directly references
   */
  public referencesForItem(
    itemToLookupUuidFor: Models.DecryptedItemInterface,
    contentType?: ContentType,
  ): Models.DecryptedItemInterface[] {
    const item = this.findSureItem(itemToLookupUuidFor.uuid)
    const uuids = item.references.map((ref) => ref.uuid)
    let references = this.findItems(uuids)
    if (contentType) {
      references = references.filter((ref) => {
        return ref?.content_type === contentType
      })
    }
    return references
  }

  private setPayloads(data: PayloadManagerChangeData) {
    const { changed, inserted, discarded, ignored, unerrored, source, sourceKey } = data

    const createItem = (payload: Models.FullyFormedPayloadInterface) => {
      return Models.CreateItemFromPayload(payload)
    }

    const affectedContentTypes = new Set<ContentType>()

    const changedItems = changed.map((p) => {
      affectedContentTypes.add(p.content_type)
      return createItem(p)
    })

    const insertedItems = inserted.map((p) => {
      affectedContentTypes.add(p.content_type)
      return createItem(p)
    })

    const discardedItems: Models.DeletedItemInterface[] = discarded.map((p) => {
      affectedContentTypes.add(p.content_type)
      return new Models.DeletedItem(p)
    })

    const ignoredItems: Models.EncryptedItemInterface[] = ignored.map((p) => {
      affectedContentTypes.add(p.content_type)
      return new Models.EncryptedItem(p)
    })

    const unerroredItems = unerrored.map((p) => {
      affectedContentTypes.add(p.content_type)
      return Models.CreateDecryptedItemFromPayload(p)
    })

    const delta: Models.ItemDelta = {
      changed: changedItems,
      inserted: insertedItems,
      discarded: discardedItems,
      ignored: ignoredItems,
      unerrored: unerroredItems,
    }

    this.collection.onChange(delta)
    this.tagItemsIndex.onChange(delta)

    const affectedContentTypesArray = Array.from(affectedContentTypes.values())
    for (const controller of this.allDisplayControllers) {
      if (controller.contentTypes.some((ct) => affectedContentTypesArray.includes(ct))) {
        controller.onCollectionChange(delta)
      }
    }

    this.notifyObserversByUiAdjustingDelta(delta, source, sourceKey)
  }

  private notifyObserversByUiAdjustingDelta(
    delta: Models.ItemDelta,
    source: Models.PayloadEmitSource,
    sourceKey?: string,
  ) {
    const changedItems: Models.DecryptedItemInterface[] = []
    const insertedItems: Models.DecryptedItemInterface[] = []
    const changedDeleted: Models.DeletedItemInterface[] = []
    const insertedDeleted: Models.DeletedItemInterface[] = []
    const changedToEncrypted: Models.EncryptedItemInterface[] = []

    for (const item of delta.changed) {
      if (Models.isDeletedItem(item)) {
        changedDeleted.push(item)
      } else if (Models.isDecryptedItem(item)) {
        changedItems.push(item)
      } else {
        changedToEncrypted.push(item)
      }
    }

    for (const item of delta.inserted) {
      if (Models.isDeletedItem(item)) {
        insertedDeleted.push(item)
      } else if (Models.isDecryptedItem(item)) {
        insertedItems.push(item)
      }
    }

    const itemsToRemoveFromUI: (Models.DeletedItemInterface | Models.EncryptedItemInterface)[] = [
      ...delta.discarded,
      ...changedDeleted,
      ...insertedDeleted,
      ...changedToEncrypted,
    ]

    this.notifyObservers(
      changedItems,
      insertedItems,
      itemsToRemoveFromUI,
      delta.ignored,
      delta.unerrored,
      source,
      sourceKey,
    )
  }

  private notifyObservers(
    changed: Models.DecryptedItemInterface[],
    inserted: Models.DecryptedItemInterface[],
    removed: (Models.DeletedItemInterface | Models.EncryptedItemInterface)[],
    ignored: Models.EncryptedItemInterface[],
    unerrored: Models.DecryptedItemInterface[],
    source: Models.PayloadEmitSource,
    sourceKey?: string,
  ) {
    const filter = <I extends Models.ItemInterface>(items: I[], types: ContentType[]) => {
      return items.filter((item) => {
        return types.includes(ContentType.Any) || types.includes(item.content_type)
      })
    }

    const frozenObservers = this.observers.slice()
    for (const observer of frozenObservers) {
      const filteredChanged = filter(changed, observer.contentType)
      const filteredInserted = filter(inserted, observer.contentType)
      const filteredDiscarded = filter(removed, observer.contentType)
      const filteredIgnored = filter(ignored, observer.contentType)
      const filteredUnerrored = filter(unerrored, observer.contentType)

      if (
        filteredChanged.length === 0 &&
        filteredInserted.length === 0 &&
        filteredDiscarded.length === 0 &&
        filteredIgnored.length === 0 &&
        filteredUnerrored.length === 0
      ) {
        continue
      }

      observer.callback({
        changed: filteredChanged,
        inserted: filteredInserted,
        removed: filteredDiscarded,
        ignored: filteredIgnored,
        unerrored: filteredUnerrored,
        source,
        sourceKey,
      })
    }
  }

  /**
   * Consumers wanting to modify an item should run it through this block,
   * so that data is properly mapped through our function, and latest state
   * is properly reconciled.
   */
  public async changeItem<
    M extends Models.DecryptedItemMutator = Models.DecryptedItemMutator,
    I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface,
  >(
    itemToLookupUuidFor: I,
    mutate?: (mutator: M) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<I> {
    const results = await this.changeItems<M, I>(
      [itemToLookupUuidFor],
      mutate,
      mutationType,
      emitSource,
      payloadSourceKey,
    )
    return results[0]
  }

  /**
   * @param mutate If not supplied, the intention would simply be to mark the item as dirty.
   */
  public async changeItems<
    M extends Models.DecryptedItemMutator = Models.DecryptedItemMutator,
    I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface,
  >(
    itemsToLookupUuidsFor: I[],
    mutate?: (mutator: M) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<I[]> {
    const items = this.findItemsIncludingBlanks(Uuids(itemsToLookupUuidsFor))
    const payloads: Models.DecryptedPayloadInterface[] = []

    for (const item of items) {
      if (!item) {
        throw Error('Attempting to change non-existant item')
      }
      const mutator = Models.CreateDecryptedMutatorForItem(item, mutationType)
      if (mutate) {
        mutate(mutator as M)
      }
      const payload = mutator.getResult()
      payloads.push(payload)
    }

    await this.payloadManager.emitPayloads(payloads, emitSource, payloadSourceKey)

    const results = this.findItems(payloads.map((p) => p.uuid)) as I[]

    return results
  }

  /**
   * Run unique mutations per each item in the array, then only propagate all changes
   * once all mutations have been run. This differs from `changeItems` in that changeItems
   * runs the same mutation on all items.
   */
  public async runTransactionalMutations(
    transactions: Models.TransactionalMutation[],
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<(Models.DecryptedItemInterface | undefined)[]> {
    const payloads: Models.DecryptedPayloadInterface[] = []

    for (const transaction of transactions) {
      const item = this.findItem(transaction.itemUuid)

      if (!item) {
        continue
      }

      const mutator = Models.CreateDecryptedMutatorForItem(
        item,
        transaction.mutationType || Models.MutationType.UpdateUserTimestamps,
      )

      transaction.mutate(mutator)
      const payload = mutator.getResult()
      payloads.push(payload)
    }

    await this.payloadManager.emitPayloads(payloads, emitSource, payloadSourceKey)
    const results = this.findItems(payloads.map((p) => p.uuid))
    return results
  }

  public async runTransactionalMutation(
    transaction: Models.TransactionalMutation,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.DecryptedItemInterface | undefined> {
    const item = this.findSureItem(transaction.itemUuid)
    const mutator = Models.CreateDecryptedMutatorForItem(
      item,
      transaction.mutationType || Models.MutationType.UpdateUserTimestamps,
    )
    transaction.mutate(mutator)
    const payload = mutator.getResult()

    await this.payloadManager.emitPayloads([payload], emitSource, payloadSourceKey)
    const result = this.findItem(payload.uuid)
    return result
  }

  async changeNote(
    itemToLookupUuidFor: Models.SNNote,
    mutate: (mutator: Models.NoteMutator) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.DecryptedPayloadInterface[]> {
    const note = this.findItem<Models.SNNote>(itemToLookupUuidFor.uuid)
    if (!note) {
      throw Error('Attempting to change non-existant note')
    }
    const mutator = new Models.NoteMutator(note, mutationType)

    return this.applyTransform(mutator, mutate, emitSource, payloadSourceKey)
  }

  async changeTag(
    itemToLookupUuidFor: Models.SNTag,
    mutate: (mutator: Models.TagMutator) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.SNTag> {
    const tag = this.findItem<Models.SNTag>(itemToLookupUuidFor.uuid)
    if (!tag) {
      throw Error('Attempting to change non-existant tag')
    }
    const mutator = new Models.TagMutator(tag, mutationType)
    await this.applyTransform(mutator, mutate, emitSource, payloadSourceKey)
    return this.findSureItem<Models.SNTag>(itemToLookupUuidFor.uuid)
  }

  async changeComponent(
    itemToLookupUuidFor: Models.SNComponent,
    mutate: (mutator: Models.ComponentMutator) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.SNComponent> {
    const component = this.findItem<Models.SNComponent>(itemToLookupUuidFor.uuid)
    if (!component) {
      throw Error('Attempting to change non-existant component')
    }
    const mutator = new Models.ComponentMutator(component, mutationType)
    await this.applyTransform(mutator, mutate, emitSource, payloadSourceKey)
    return this.findSureItem<Models.SNComponent>(itemToLookupUuidFor.uuid)
  }

  async changeFeatureRepo(
    itemToLookupUuidFor: Models.SNFeatureRepo,
    mutate: (mutator: Models.FeatureRepoMutator) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.SNFeatureRepo> {
    const repo = this.findItem(itemToLookupUuidFor.uuid)
    if (!repo) {
      throw Error('Attempting to change non-existant repo')
    }
    const mutator = new Models.FeatureRepoMutator(repo, mutationType)
    await this.applyTransform(mutator, mutate, emitSource, payloadSourceKey)
    return this.findSureItem<Models.SNFeatureRepo>(itemToLookupUuidFor.uuid)
  }

  async changeActionsExtension(
    itemToLookupUuidFor: Models.SNActionsExtension,
    mutate: (mutator: Models.ActionsExtensionMutator) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.SNActionsExtension> {
    const extension = this.findItem<Models.SNActionsExtension>(itemToLookupUuidFor.uuid)
    if (!extension) {
      throw Error('Attempting to change non-existant extension')
    }
    const mutator = new Models.ActionsExtensionMutator(extension, mutationType)
    await this.applyTransform(mutator, mutate, emitSource, payloadSourceKey)
    return this.findSureItem<Models.SNActionsExtension>(itemToLookupUuidFor.uuid)
  }

  async changeItemsKey(
    itemToLookupUuidFor: Models.ItemsKeyInterface,
    mutate: (mutator: Models.ItemsKeyMutatorInterface) => void,
    mutationType: Models.MutationType = Models.MutationType.UpdateUserTimestamps,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.ItemsKeyInterface> {
    const itemsKey = this.findItem<SNItemsKey>(itemToLookupUuidFor.uuid)

    if (!itemsKey) {
      throw Error('Attempting to change non-existant itemsKey')
    }

    const mutator = new ItemsKeyMutator(itemsKey, mutationType)

    await this.applyTransform(mutator, mutate, emitSource, payloadSourceKey)

    return this.findSureItem<Models.ItemsKeyInterface>(itemToLookupUuidFor.uuid)
  }

  private async applyTransform<T extends Models.DecryptedItemMutator>(
    mutator: T,
    mutate: (mutator: T) => void,
    emitSource = Models.PayloadEmitSource.LocalChanged,
    payloadSourceKey?: string,
  ): Promise<Models.DecryptedPayloadInterface[]> {
    mutate(mutator)
    const payload = mutator.getResult()
    return this.payloadManager.emitPayload(payload, emitSource, payloadSourceKey)
  }

  /**
   * Sets the item as needing sync. The item is then run through the mapping function,
   * and propagated to mapping observers.
   * @param isUserModified - Whether to update the item's "user modified date"
   */
  public async setItemDirty(itemToLookupUuidFor: Models.DecryptedItemInterface, isUserModified = false) {
    const result = await this.setItemsDirty([itemToLookupUuidFor], isUserModified)
    return result[0]
  }

  public async setItemsDirty(
    itemsToLookupUuidsFor: Models.DecryptedItemInterface[],
    isUserModified = false,
  ): Promise<Models.DecryptedItemInterface[]> {
    return this.changeItems(
      itemsToLookupUuidsFor,
      undefined,
      isUserModified ? Models.MutationType.UpdateUserTimestamps : Models.MutationType.NoUpdateUserTimestamps,
    )
  }

  /**
   * Returns an array of items that need to be synced.
   */
  public getDirtyItems(): (Models.DecryptedItemInterface | Models.DeletedItemInterface)[] {
    return this.collection.dirtyElements().filter(Models.isDecryptedOrDeletedItem)
  }

  /**
   * Duplicates an item and maps it, thus propagating the item to observers.
   * @param isConflict - Whether to mark the duplicate as a conflict of the original.
   */
  public async duplicateItem<T extends Models.DecryptedItemInterface>(
    itemToLookupUuidFor: T,
    isConflict = false,
    additionalContent?: Partial<Models.ItemContent>,
  ) {
    const item = this.findSureItem(itemToLookupUuidFor.uuid)
    const payload = item.payload.copy()
    const resultingPayloads = Models.PayloadsByDuplicating({
      payload,
      baseCollection: this.payloadManager.getMasterCollection(),
      isConflict,
      additionalContent,
    })

    await this.payloadManager.emitPayloads(resultingPayloads, Models.PayloadEmitSource.LocalChanged)
    const duplicate = this.findSureItem<T>(resultingPayloads[0].uuid)
    return duplicate
  }

  public async createItem<T extends Models.DecryptedItemInterface, C extends Models.ItemContent = Models.ItemContent>(
    contentType: ContentType,
    content: C,
    needsSync = false,
  ): Promise<T> {
    const payload = new Models.DecryptedPayload<C>({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: contentType,
      content: Models.FillItemContent<C>(content),
      dirty: needsSync,
      ...Models.PayloadTimestampDefaults(),
    })

    await this.payloadManager.emitPayload(payload, Models.PayloadEmitSource.LocalInserted)

    return this.findSureItem<T>(payload.uuid)
  }

  public createTemplateItem<
    C extends Models.ItemContent = Models.ItemContent,
    I extends Models.DecryptedItemInterface<C> = Models.DecryptedItemInterface<C>,
  >(contentType: ContentType, content?: C): I {
    const payload = new Models.DecryptedPayload<C>({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: contentType,
      content: Models.FillItemContent<C>(content || {}),
      ...Models.PayloadTimestampDefaults(),
    })
    const item = Models.CreateDecryptedItemFromPayload<C, I>(payload)
    return item
  }

  /**
   * @param item item to be checked
   * @returns Whether the item is a template (unmanaged)
   */
  public isTemplateItem(item: Models.DecryptedItemInterface): boolean {
    return !this.findItem(item.uuid)
  }

  public async insertItem(item: Models.DecryptedItemInterface): Promise<Models.DecryptedItemInterface> {
    return this.emitItemFromPayload(item.payload, Models.PayloadEmitSource.LocalChanged)
  }

  public async insertItems(
    items: Models.DecryptedItemInterface[],
    emitSource: Models.PayloadEmitSource = Models.PayloadEmitSource.LocalInserted,
  ): Promise<Models.DecryptedItemInterface[]> {
    return this.emitItemsFromPayloads(
      items.map((item) => item.payload),
      emitSource,
    )
  }

  public async emitItemFromPayload(
    payload: Models.DecryptedPayloadInterface,
    emitSource: Models.PayloadEmitSource,
  ): Promise<Models.DecryptedItemInterface> {
    await this.payloadManager.emitPayload(payload, emitSource)

    return this.findSureItem(payload.uuid)
  }

  public async emitItemsFromPayloads(
    payloads: Models.DecryptedPayloadInterface[],
    emitSource: Models.PayloadEmitSource,
  ): Promise<Models.DecryptedItemInterface[]> {
    await this.payloadManager.emitPayloads(payloads, emitSource)

    const uuids = Uuids(payloads)

    return this.findItems(uuids)
  }

  public async setItemToBeDeleted(
    itemToLookupUuidFor: Models.DecryptedItemInterface | Models.EncryptedItemInterface,
    source: Models.PayloadEmitSource = Models.PayloadEmitSource.LocalChanged,
  ): Promise<void> {
    const referencingIdsCapturedBeforeChanges = this.collection.uuidsThatReferenceUuid(itemToLookupUuidFor.uuid)

    const item = this.findAnyItem(itemToLookupUuidFor.uuid)

    if (!item) {
      return
    }

    const mutator = new Models.DeleteItemMutator(item, Models.MutationType.UpdateUserTimestamps)

    const deletedPayload = mutator.getDeletedResult()

    await this.payloadManager.emitPayload(deletedPayload, source)

    for (const referencingId of referencingIdsCapturedBeforeChanges) {
      const referencingItem = this.findItem(referencingId)

      if (referencingItem) {
        await this.changeItem(referencingItem, (mutator) => {
          mutator.removeItemAsRelationship(item)
        })
      }
    }
  }

  public async setItemsToBeDeleted(
    itemsToLookupUuidsFor: (Models.DecryptedItemInterface | Models.EncryptedItemInterface)[],
  ): Promise<void> {
    await Promise.all(itemsToLookupUuidsFor.map((item) => this.setItemToBeDeleted(item)))
  }

  public getItems<T extends Models.DecryptedItemInterface>(contentType: ContentType | ContentType[]): T[] {
    return this.collection.allDecrypted<T>(contentType)
  }

  getAnyItems(contentType: ContentType | ContentType[]): Models.ItemInterface[] {
    return this.collection.all(contentType)
  }

  public itemsMatchingPredicate<T extends Models.DecryptedItemInterface>(
    contentType: ContentType,
    predicate: Models.PredicateInterface<T>,
  ): T[] {
    return this.itemsMatchingPredicates(contentType, [predicate])
  }

  public itemsMatchingPredicates<T extends Models.DecryptedItemInterface>(
    contentType: ContentType,
    predicates: Models.PredicateInterface<T>[],
  ): T[] {
    const subItems = this.getItems<T>(contentType)
    return this.subItemsMatchingPredicates(subItems, predicates)
  }

  public subItemsMatchingPredicates<T extends Models.DecryptedItemInterface>(
    items: T[],
    predicates: Models.PredicateInterface<T>[],
  ): T[] {
    const results = items.filter((item) => {
      for (const predicate of predicates) {
        if (!item.satisfiesPredicate(predicate)) {
          return false
        }
      }
      return true
    })

    return results
  }

  public getRootTags(): Models.SNTag[] {
    return this.getDisplayableTags().filter((tag) => tag.parentId === undefined)
  }

  public findTagByTitle(title: string): Models.SNTag | undefined {
    const lowerCaseTitle = title.toLowerCase()
    return this.getDisplayableTags().find((tag) => tag.title?.toLowerCase() === lowerCaseTitle)
  }

  public findTagByTitleAndParent(title: string, parentItemToLookupUuidFor?: Models.SNTag): Models.SNTag | undefined {
    const lowerCaseTitle = title.toLowerCase()

    const tags = parentItemToLookupUuidFor ? this.getTagChildren(parentItemToLookupUuidFor) : this.getRootTags()

    return tags.find((tag) => tag.title?.toLowerCase() === lowerCaseTitle)
  }

  /**
   * Finds tags with title or component starting with a search query and (optionally) not associated with a note
   * @param searchQuery - The query string to match
   * @param note - The note whose tags should be omitted from results
   * @returns Array containing tags matching search query and not associated with note
   */
  public searchTags(searchQuery: string, note?: Models.SNNote): Models.SNTag[] {
    return naturalSort(
      this.getDisplayableTags().filter((tag) => {
        const expandedTitle = this.getTagLongTitle(tag)
        const matchesQuery = expandedTitle.toLowerCase().includes(searchQuery.toLowerCase())
        const tagInNote = note ? this.itemsReferencingItem(note).some((item) => item?.uuid === tag.uuid) : false
        return matchesQuery && !tagInNote
      }),
      'title',
    )
  }

  getTagParent(itemToLookupUuidFor: Models.SNTag): Models.SNTag | undefined {
    const tag = this.findItem<Models.SNTag>(itemToLookupUuidFor.uuid)
    if (!tag) {
      return undefined
    }
    const parentId = tag.parentId
    if (parentId) {
      return this.findItem(parentId) as Models.SNTag
    }
    return undefined
  }

  public getTagPrefixTitle(tag: Models.SNTag): string | undefined {
    const hierarchy = this.getTagParentChain(tag)

    if (hierarchy.length === 0) {
      return undefined
    }

    const prefixTitle = hierarchy.map((tag) => tag.title).join('/')
    return `${prefixTitle}/`
  }

  public getTagLongTitle(tag: Models.SNTag): string {
    const hierarchy = this.getTagParentChain(tag)
    const tags = [...hierarchy, tag]
    const longTitle = tags.map((tag) => tag.title).join('/')
    return longTitle
  }

  getTagParentChain(itemToLookupUuidFor: Models.SNTag): Models.SNTag[] {
    const tag = this.findItem<Models.SNTag>(itemToLookupUuidFor.uuid)
    if (!tag) {
      return []
    }

    let parentId = tag.parentId
    const chain: Models.SNTag[] = []

    while (parentId) {
      const parent = this.findItem<Models.SNTag>(parentId)
      if (!parent) {
        return chain
      }
      chain.unshift(parent)
      parentId = parent.parentId
    }

    return chain
  }

  public async findOrCreateTagParentChain(titlesHierarchy: string[]): Promise<Models.SNTag> {
    let current: Models.SNTag | undefined = undefined

    for (const title of titlesHierarchy) {
      current = await this.findOrCreateTagByTitle(title, current)
    }

    if (!current) {
      throw new Error('Invalid tag hierarchy')
    }

    return current
  }

  public getTagChildren(itemToLookupUuidFor: Models.SNTag): Models.SNTag[] {
    const tag = this.findItem<Models.SNTag>(itemToLookupUuidFor.uuid)
    if (!tag) {
      return []
    }

    const tags = this.collection.elementsReferencingElement(tag, ContentType.Tag) as Models.SNTag[]

    return tags.filter((tag) => tag.parentId === itemToLookupUuidFor.uuid)
  }

  public isTagAncestor(tagToLookUpUuidFor: Models.SNTag, childToLookUpUuidFor: Models.SNTag): boolean {
    const tag = this.findItem<Models.SNTag>(childToLookUpUuidFor.uuid)
    if (!tag) {
      return false
    }

    let parentId = tag.parentId

    while (parentId) {
      if (parentId === tagToLookUpUuidFor.uuid) {
        return true
      }

      const parent = this.findItem<Models.SNTag>(parentId)
      if (!parent) {
        return false
      }

      parentId = parent.parentId
    }

    return false
  }

  public isValidTagParent(parentTagToLookUpUuidFor: Models.SNTag, childToLookUpUuidFor: Models.SNTag): boolean {
    if (parentTagToLookUpUuidFor.uuid === childToLookUpUuidFor.uuid) {
      return false
    }

    if (this.isTagAncestor(childToLookUpUuidFor, parentTagToLookUpUuidFor)) {
      return false
    }

    return true
  }

  /**
   * @returns The changed child tag
   */
  public setTagParent(parentTag: Models.SNTag, childTag: Models.SNTag): Promise<Models.SNTag> {
    if (parentTag.uuid === childTag.uuid) {
      throw new Error('Can not set a tag parent of itself')
    }

    if (this.isTagAncestor(childTag, parentTag)) {
      throw new Error('Can not set a tag ancestor of itself')
    }

    return this.changeTag(childTag, (m) => {
      m.makeChildOf(parentTag)
    })
  }

  /**
   * @returns The changed child tag
   */
  public unsetTagParent(childTag: Models.SNTag): Promise<Models.SNTag> {
    const parentTag = this.getTagParent(childTag)

    if (!parentTag) {
      return Promise.resolve(childTag)
    }

    return this.changeTag(childTag, (m) => {
      m.unsetParent()
    })
  }

  public async associateFileWithNote(file: Models.FileItem, note: Models.SNNote): Promise<Models.FileItem> {
    return this.changeItem<Models.FileMutator, Models.FileItem>(file, (mutator) => {
      mutator.addNote(note)
    })
  }

  public async disassociateFileWithNote(file: Models.FileItem, note: Models.SNNote): Promise<Models.FileItem> {
    return this.changeItem<Models.FileMutator, Models.FileItem>(file, (mutator) => {
      mutator.removeNote(note)
    })
  }

  public async addTagToNote(note: Models.SNNote, tag: Models.SNTag, addHierarchy: boolean): Promise<Models.SNTag[]> {
    let tagsToAdd = [tag]

    if (addHierarchy) {
      const parentChainTags = this.getTagParentChain(tag)
      tagsToAdd = [...parentChainTags, tag]
    }

    return Promise.all(
      tagsToAdd.map((tagToAdd) => {
        return this.changeTag(tagToAdd, (mutator) => {
          mutator.addNote(note)
        }) as Promise<Models.SNTag>
      }),
    )
  }

  public async addTagToFile(file: Models.FileItem, tag: Models.SNTag, addHierarchy: boolean): Promise<Models.SNTag[]> {
    let tagsToAdd = [tag]

    if (addHierarchy) {
      const parentChainTags = this.getTagParentChain(tag)
      tagsToAdd = [...parentChainTags, tag]
    }

    return Promise.all(
      tagsToAdd.map((tagToAdd) => {
        return this.changeTag(tagToAdd, (mutator) => {
          mutator.addFile(file)
        }) as Promise<Models.SNTag>
      }),
    )
  }

  public async linkNoteToNote(note: Models.SNNote, otherNote: Models.SNNote): Promise<Models.SNNote> {
    return this.changeItem<Models.NoteMutator, Models.SNNote>(note, (mutator) => {
      mutator.addNote(otherNote)
    })
  }

  public async linkFileToFile(file: Models.FileItem, otherFile: Models.FileItem): Promise<Models.FileItem> {
    return this.changeItem<Models.FileMutator, Models.FileItem>(file, (mutator) => {
      mutator.addFile(otherFile)
    })
  }

  public async unlinkItem(
    item: DecryptedItemInterface<ItemContent>,
    itemToUnlink: DecryptedItemInterface<ItemContent>,
  ) {
    return this.changeItem(item, (mutator) => {
      mutator.removeItemAsRelationship(itemToUnlink)
    })
  }

  /**
   * Get tags for a note sorted in natural order
   * @param item - The item whose tags will be returned
   * @returns Array containing tags associated with an item
   */
  public getSortedTagsForItem(item: DecryptedItemInterface<ItemContent>): Models.SNTag[] {
    return naturalSort(
      this.itemsReferencingItem(item).filter((ref) => {
        return ref?.content_type === ContentType.Tag
      }) as Models.SNTag[],
      'title',
    )
  }

  public getSortedFilesForItem(item: DecryptedItemInterface<ItemContent>): Models.FileItem[] {
    if (this.isTemplateItem(item)) {
      return []
    }

    const filesReferencingItem = this.itemsReferencingItem(item).filter(
      (ref) => ref.content_type === ContentType.File,
    ) as Models.FileItem[]
    const filesReferencedByItem = this.referencesForItem(item).filter(
      (ref) => ref.content_type === ContentType.File,
    ) as Models.FileItem[]

    return naturalSort(filesReferencingItem.concat(filesReferencedByItem), 'title')
  }

  public getSortedLinkedNotesForItem(item: DecryptedItemInterface<ItemContent>): Models.SNNote[] {
    if (this.isTemplateItem(item)) {
      return []
    }

    const notesReferencedByItem = this.referencesForItem(item).filter(
      (ref) => ref.content_type === ContentType.Note,
    ) as Models.SNNote[]

    return naturalSort(notesReferencedByItem, 'title')
  }

  public getSortedNotesLinkingToItem(item: Models.DecryptedItemInterface<Models.ItemContent>): Models.SNNote[] {
    if (this.isTemplateItem(item)) {
      return []
    }

    const notesReferencingItem = this.itemsReferencingItem(item).filter(
      (ref) => ref.content_type === ContentType.Note,
    ) as Models.SNNote[]

    return naturalSort(notesReferencingItem, 'title')
  }

  public async createTag(title: string, parentItemToLookupUuidFor?: Models.SNTag): Promise<Models.SNTag> {
    const newTag = await this.createItem<Models.SNTag>(
      ContentType.Tag,
      Models.FillItemContent<Models.TagContent>({ title }),
      true,
    )

    if (parentItemToLookupUuidFor) {
      const parentTag = this.findItem<Models.SNTag>(parentItemToLookupUuidFor.uuid)
      if (!parentTag) {
        throw new Error('Invalid parent tag')
      }
      return this.changeTag(newTag, (m) => {
        m.makeChildOf(parentTag)
      })
    }

    return newTag
  }

  public async createSmartView<T extends Models.DecryptedItemInterface>(
    title: string,
    predicate: Models.PredicateInterface<T>,
  ): Promise<Models.SmartView> {
    return this.createItem(
      ContentType.SmartView,
      Models.FillItemContent({
        title,
        predicate: predicate.toJson(),
      } as Models.SmartViewContent),
      true,
    ) as Promise<Models.SmartView>
  }

  public async createSmartViewFromDSL<T extends Models.DecryptedItemInterface>(dsl: string): Promise<Models.SmartView> {
    let components = null
    try {
      components = JSON.parse(dsl.substring(1, dsl.length))
    } catch (e) {
      throw Error('Invalid smart view syntax')
    }

    const title = components[0]
    const predicate = Models.predicateFromDSLString<T>(dsl)
    return this.createSmartView(title, predicate)
  }

  public async createTagOrSmartView(title: string): Promise<Models.SNTag | Models.SmartView> {
    if (this.isSmartViewTitle(title)) {
      return this.createSmartViewFromDSL(title)
    } else {
      return this.createTag(title)
    }
  }

  public isSmartViewTitle(title: string): boolean {
    return title.startsWith(Models.SMART_TAG_DSL_PREFIX)
  }

  /**
   * Finds or creates a tag with a given title
   */
  public async findOrCreateTagByTitle(title: string, parentItemToLookupUuidFor?: Models.SNTag): Promise<Models.SNTag> {
    const tag = this.findTagByTitleAndParent(title, parentItemToLookupUuidFor)
    return tag || this.createTag(title, parentItemToLookupUuidFor)
  }

  public notesMatchingSmartView(view: Models.SmartView): Models.SNNote[] {
    const criteria: Models.FilterDisplayOptions = {
      views: [view],
    }

    return Models.itemsMatchingOptions(
      criteria,
      this.collection.allDecrypted(ContentType.Note),
      this.collection,
    ) as Models.SNNote[]
  }

  public get allNotesSmartView(): Models.SmartView {
    return this.systemSmartViews.find((tag) => tag.uuid === Models.SystemViewId.AllNotes) as Models.SmartView
  }

  public get archivedSmartView(): Models.SmartView {
    return this.systemSmartViews.find((tag) => tag.uuid === Models.SystemViewId.ArchivedNotes) as Models.SmartView
  }

  public get trashSmartView(): Models.SmartView {
    return this.systemSmartViews.find((tag) => tag.uuid === Models.SystemViewId.TrashedNotes) as Models.SmartView
  }

  public get untaggedNotesSmartView(): Models.SmartView {
    return this.systemSmartViews.find((tag) => tag.uuid === Models.SystemViewId.UntaggedNotes) as Models.SmartView
  }

  public get trashedItems(): Models.SNNote[] {
    return this.notesMatchingSmartView(this.trashSmartView)
  }

  /**
   * Permanently deletes any items currently in the trash. Consumer must manually call sync.
   */
  public async emptyTrash(): Promise<void> {
    const notes = this.trashedItems
    await this.setItemsToBeDeleted(notes)
  }

  /**
   * Returns all smart views, sorted by title.
   */
  public getSmartViews(): Models.SmartView[] {
    const userTags = this.smartViewDisplayController.items()
    return this.systemSmartViews.concat(userTags)
  }

  /**
   * The number of notes currently managed
   */
  public get noteCount(): number {
    return this.collection.all(ContentType.Note).length
  }

  /**
   * Immediately removes all items from mapping state and notifies observers
   * Used primarily when signing into an account and wanting to discard any current
   * local data.
   */
  public async removeAllItemsFromMemory(): Promise<void> {
    const uuids = Uuids(this.items)
    const results: Models.DeletedPayloadInterface[] = []

    for (const uuid of uuids) {
      const mutator = new Models.DeleteItemMutator(
        this.findSureItem(uuid),
        /** We don't want to set as dirty, since we want to dispose of immediately. */
        Models.MutationType.NonDirtying,
      )
      results.push(mutator.getDeletedResult())
    }

    await this.payloadManager.emitPayloads(results, Models.PayloadEmitSource.LocalChanged)

    this.resetState()
    this.payloadManager.resetState()
  }

  public removeItemLocally(item: Models.DecryptedItemInterface | Models.DeletedItemInterface): void {
    this.collection.discard([item])
    this.payloadManager.removePayloadLocally(item.payload)

    const delta = Models.CreateItemDelta({ discarded: [item] as Models.DeletedItemInterface[] })
    for (const controller of this.allDisplayControllers) {
      if (controller.contentTypes.some((ct) => ct === item.content_type)) {
        controller.onCollectionChange(delta)
      }
    }
  }

  public renameFile(file: Models.FileItem, name: string): Promise<Models.FileItem> {
    return this.changeItem<Models.FileMutator, Models.FileItem>(file, (mutator) => {
      mutator.name = name
    })
  }

  public async setLastSyncBeganForItems(
    itemsToLookupUuidsFor: (Models.DecryptedItemInterface | Models.DeletedItemInterface)[],
    date: Date,
    globalDirtyIndex: number,
  ): Promise<(Models.DecryptedItemInterface | Models.DeletedItemInterface)[]> {
    const uuids = Uuids(itemsToLookupUuidsFor)

    const items = this.collection.findAll(uuids).filter(Models.isDecryptedOrDeletedItem)

    const payloads: (Models.DecryptedPayloadInterface | Models.DeletedPayloadInterface)[] = []

    for (const item of items) {
      const mutator = new Models.ItemMutator<Models.DecryptedPayloadInterface | Models.DeletedPayloadInterface>(
        item,
        Models.MutationType.NonDirtying,
      )

      mutator.setBeginSync(date, globalDirtyIndex)

      const payload = mutator.getResult()

      payloads.push(payload)
    }

    await this.payloadManager.emitPayloads(payloads, Models.PayloadEmitSource.PreSyncSave)

    return this.findAnyItems(uuids) as (Models.DecryptedItemInterface | Models.DeletedItemInterface)[]
  }

  /**
   * @returns `'direct'` if `itemOne` has the reference to `itemTwo`, `'indirect'` if `itemTwo` has the reference to `itemOne`, `'unlinked'` if neither reference each other
   */
  public relationshipTypeForItems(
    itemOne: Models.DecryptedItemInterface<Models.ItemContent>,
    itemTwo: Models.DecryptedItemInterface<Models.ItemContent>,
  ): 'direct' | 'indirect' | 'unlinked' {
    const itemOneReferencesItemTwo = !!this.referencesForItem(itemOne).find(
      (reference) => reference.uuid === itemTwo.uuid,
    )
    const itemTwoReferencesItemOne = !!this.referencesForItem(itemTwo).find(
      (reference) => reference.uuid === itemOne.uuid,
    )

    return itemOneReferencesItemTwo ? 'direct' : itemTwoReferencesItemOne ? 'indirect' : 'unlinked'
  }

  override getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve({
      items: {
        allIds: Uuids(this.collection.all()),
      },
    })
  }
}
