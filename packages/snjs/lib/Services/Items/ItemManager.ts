import { assert, naturalSort, removeFromArray, UuidGenerator, Uuids } from '@standardnotes/utils'
import { SNItemsKey } from '@standardnotes/encryption'
import { PayloadManager } from '../Payloads/PayloadManager'
import { TagsToFoldersMigrationApplicator } from '../../Migrations/Applicators/TagsToFolders'
import { UuidString } from '../../Types/UuidString'
import * as Models from '@standardnotes/models'
import * as Services from '@standardnotes/services'
import { PayloadManagerChangeData } from '../Payloads'
import { ItemRelationshipDirection } from '@standardnotes/services'
import { ContentType } from '@standardnotes/domain-core'

type ItemsChangeObserver<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface> = {
  contentType: string[]
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
export class ItemManager extends Services.AbstractService implements Services.ItemManagerInterface {
  private unsubChangeObserver: () => void
  private observers: ItemsChangeObserver[] = []
  private collection!: Models.ItemCollection
  private systemSmartViews: Models.SmartView[]
  private itemCounter!: Models.ItemCounter
  private streamDisposers: (() => void)[] = []

  private navigationDisplayController!: Models.ItemDisplayController<
    Models.SNNote | Models.FileItem,
    Models.NotesAndFilesDisplayOptions
  >
  private tagDisplayController!: Models.ItemDisplayController<Models.SNTag, Models.TagsAndViewsDisplayOptions>
  private itemsKeyDisplayController!: Models.ItemDisplayController<SNItemsKey>
  private componentDisplayController!: Models.ItemDisplayController<Models.ComponentInterface>
  private themeDisplayController!: Models.ItemDisplayController<Models.ComponentInterface>
  private fileDisplayController!: Models.ItemDisplayController<Models.FileItem>
  private smartViewDisplayController!: Models.ItemDisplayController<Models.SmartView, Models.TagsAndViewsDisplayOptions>

  constructor(
    private payloadManager: PayloadManager,
    protected override internalEventBus: Services.InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.payloadManager = payloadManager
    this.systemSmartViews = this.rebuildSystemSmartViews({})
    this.createCollection()
    this.unsubChangeObserver = this.payloadManager.addObserver(ContentType.TYPES.Any, this.setPayloads.bind(this))
  }

  private rebuildSystemSmartViews(criteria: Models.NotesAndFilesDisplayOptions): Models.SmartView[] {
    this.systemSmartViews = Models.BuildSmartViews(criteria)
    return this.systemSmartViews
  }

  public getCollection(): Models.ItemCollection {
    return this.collection
  }

  private createCollection() {
    this.collection = new Models.ItemCollection()

    this.navigationDisplayController = new Models.ItemDisplayController(
      this.collection,
      [ContentType.TYPES.Note, ContentType.TYPES.File],
      {
        sortBy: 'created_at',
        sortDirection: 'dsc',
        hiddenContentTypes: [],
      },
    )
    this.tagDisplayController = new Models.ItemDisplayController<Models.SNTag, Models.TagsAndViewsDisplayOptions>(
      this.collection,
      [ContentType.TYPES.Tag],
      {
        sortBy: 'title',
        sortDirection: 'asc',
      },
    )
    this.itemsKeyDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.TYPES.ItemsKey], {
      sortBy: 'created_at',
      sortDirection: 'asc',
    })
    this.componentDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.TYPES.Component], {
      sortBy: 'created_at',
      sortDirection: 'asc',
    })
    this.themeDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.TYPES.Theme], {
      sortBy: 'title',
      sortDirection: 'asc',
    })
    this.smartViewDisplayController = new Models.ItemDisplayController<
      Models.SmartView,
      Models.TagsAndViewsDisplayOptions
    >(this.collection, [ContentType.TYPES.SmartView], {
      sortBy: 'title',
      sortDirection: 'asc',
    })
    this.fileDisplayController = new Models.ItemDisplayController(this.collection, [ContentType.TYPES.File], {
      sortBy: 'title',
      sortDirection: 'asc',
    })

    this.itemCounter = new Models.ItemCounter(this.collection, this.itemCounter?.observers)
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

  public get invalidNonVaultedItems(): Models.EncryptedItemInterface[] {
    return this.invalidItems.filter((item) => !item.key_system_identifier)
  }

  public createItemFromPayload<T extends Models.DecryptedItemInterface>(payload: Models.DecryptedPayloadInterface): T {
    return Models.CreateDecryptedItemFromPayload(payload)
  }

  public createPayloadFromObject(object: Models.DecryptedTransferPayload): Models.DecryptedPayloadInterface {
    return new Models.DecryptedPayload(object)
  }

  public setPrimaryItemDisplayOptions(options: Models.NotesAndFilesDisplayControllerOptions): void {
    const override: Models.NotesAndFilesDisplayOptions = {}
    const additionalFilters: Models.ItemFilter[] = []

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
    if (options.views && options.views.find((view) => view.uuid === Models.SystemViewId.Conflicts)) {
      additionalFilters.push((item) => this.collection.conflictsOf(item.uuid).length > 0)
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

    const updatedOptions: Models.DisplayControllerDisplayOptions & Models.NotesAndFilesDisplayOptions = {
      ...options,
      ...override,
      ...{
        tags: mostRecentVersionOfTags,
        views: mostRecentVersionOfViews,
        hiddenContentTypes: [ContentType.TYPES.Tag],
      },
    }

    if (updatedOptions.sortBy === Models.CollectionSort.Title) {
      updatedOptions.sortDirection = updatedOptions.sortDirection === 'asc' ? 'dsc' : 'asc'
    }

    this.navigationDisplayController.setDisplayOptions({
      customFilter: Models.computeUnifiedFilterForDisplayOptions(updatedOptions, this.collection, additionalFilters),
      ...updatedOptions,
    })

    this.itemCounter.setDisplayOptions(updatedOptions)
  }

  public setTagsAndViewsDisplayOptions(options: Models.TagsAndViewsDisplayOptions): void {
    const updatedOptions: Models.TagsAndViewsDisplayOptions = {
      customFilter: Models.computeUnifiedFilterForDisplayOptions(options, this.collection),
      ...options,
    }

    this.tagDisplayController.setDisplayOptions(updatedOptions)
    this.smartViewDisplayController.setDisplayOptions(updatedOptions)
  }

  public setVaultDisplayOptions(options: Models.VaultDisplayOptions): void {
    this.navigationDisplayController.setVaultDisplayOptions(options)
    this.tagDisplayController.setVaultDisplayOptions(options)
    this.smartViewDisplayController.setVaultDisplayOptions(options)
    this.fileDisplayController.setVaultDisplayOptions(options)

    this.itemCounter.setVaultDisplayOptions(options)
  }

  public getDisplayableNotes(): Models.SNNote[] {
    assert(this.navigationDisplayController.contentTypes.length === 2)

    return this.navigationDisplayController.items().filter(Models.isNote)
  }

  public getDisplayableFiles(): Models.FileItem[] {
    return this.fileDisplayController.items()
  }

  public getDisplayableNotesAndFiles(): (Models.SNNote | Models.FileItem)[] {
    return this.navigationDisplayController.items()
  }

  public getDisplayableTags(): Models.SNTag[] {
    return this.tagDisplayController.items()
  }

  public getDisplayableItemsKeys(): SNItemsKey[] {
    return this.itemsKeyDisplayController.items()
  }

  public getDisplayableComponents(): Models.ComponentInterface[] {
    return [...this.componentDisplayController.items(), ...this.themeDisplayController.items()]
  }

  public override deinit(): void {
    this.unsubChangeObserver()
    this.streamDisposers.length = 0
    ;(this.unsubChangeObserver as unknown) = undefined
    ;(this.payloadManager as unknown) = undefined
    ;(this.collection as unknown) = undefined
    ;(this.itemCounter as unknown) = undefined
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

  private findSystemSmartView(uuid: string): Models.SmartView | undefined {
    return this.systemSmartViews.find((view) => view.uuid === uuid)
  }

  findSureItem<T extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(uuid: UuidString): T {
    return this.findItem(uuid) as T
  }

  findItems<T extends Models.DecryptedItemInterface>(uuids: UuidString[]): T[] {
    return this.collection.findAllDecrypted(uuids) as T[]
  }

  findItemsIncludingBlanks<T extends Models.DecryptedItemInterface>(uuids: UuidString[]): (T | undefined)[] {
    return this.collection.findAllDecryptedWithBlanks(uuids) as (T | undefined)[]
  }

  public get items(): Models.DecryptedItemInterface[] {
    return this.collection.nondeletedElements().filter(Models.isDecryptedItem)
  }

  /** Unlock .items, this function includes error decrypting items */
  allTrackedItems(): Models.ItemInterface[] {
    return this.collection.all()
  }

  public hasTagsNeedingFoldersMigration(): boolean {
    return TagsToFoldersMigrationApplicator.isApplicableToCurrentData(this)
  }

  public addNoteCountChangeObserver(observer: Models.TagItemCountChangeObserver): () => void {
    return this.itemCounter.addCountChangeObserver(observer)
  }

  public allCountableNotesCount(): number {
    return this.itemCounter.allCountableNotesCount()
  }

  public allCountableFilesCount(): number {
    return this.itemCounter.allCountableFilesCount()
  }

  public countableNotesForTag(tag: Models.SNTag | Models.SmartView): number {
    if (tag instanceof Models.SmartView) {
      if (tag.uuid === Models.SystemViewId.AllNotes) {
        return this.itemCounter.allCountableNotesCount()
      }

      throw Error('countableItemsForTag is not meant to be used for smart views.')
    }
    return this.itemCounter.countableItemsForTag(tag)
  }

  public getNoteCount(): number {
    return this.noteCount
  }

  public addObserver<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(
    contentType: string | string[],
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
  public itemsReferencingItem<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(
    itemToLookupUuidFor: { uuid: UuidString },
    contentType?: string,
  ): I[] {
    const uuids = this.collection.uuidsThatReferenceUuid(itemToLookupUuidFor.uuid)
    let referencing = this.findItems<I>(uuids)
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
  public referencesForItem<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(
    itemToLookupUuidFor: Models.DecryptedItemInterface,
    contentType?: string,
  ): I[] {
    const item = this.findSureItem<I>(itemToLookupUuidFor.uuid)
    const uuids = item.references.map((ref) => ref.uuid)
    let references = this.findItems<I>(uuids)
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

    const affectedContentTypes = new Set<string>()

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
    this.itemCounter.onChange(delta)

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
    const filter = <I extends Models.ItemInterface>(items: I[], types: string[]) => {
      return items.filter((item) => {
        return types.includes(ContentType.TYPES.Any) || types.includes(item.content_type)
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
   * Returns an array of items that need to be synced.
   */
  public getDirtyItems(): (Models.DecryptedItemInterface | Models.DeletedItemInterface)[] {
    return this.collection.dirtyElements().filter(Models.isDecryptedOrDeletedItem)
  }

  public createTemplateItem<
    C extends Models.ItemContent = Models.ItemContent,
    I extends Models.DecryptedItemInterface<C> = Models.DecryptedItemInterface<C>,
  >(contentType: string, content?: C, override?: Partial<Models.DecryptedPayload<C>>): I {
    const payload = new Models.DecryptedPayload<C>({
      uuid: UuidGenerator.GenerateUuid(),
      content_type: contentType,
      content: Models.FillItemContent<C>(content || {}),
      ...Models.PayloadTimestampDefaults(),
      ...override,
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

  public getItems<T extends Models.DecryptedItemInterface>(contentType: string | string[]): T[] {
    return this.collection.allDecrypted<T>(contentType)
  }

  getAnyItems(contentType: string | string[]): Models.ItemInterface[] {
    return this.collection.all(contentType)
  }

  public itemsMatchingPredicate<T extends Models.DecryptedItemInterface>(
    contentType: string,
    predicate: Models.PredicateInterface<T>,
  ): T[] {
    return this.itemsMatchingPredicates(contentType, [predicate])
  }

  public itemsMatchingPredicates<T extends Models.DecryptedItemInterface>(
    contentType: string,
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

  getDisplayableTagParent(itemToLookupUuidFor: Models.SNTag): Models.SNTag | undefined {
    const tag = this.findItem<Models.SNTag>(itemToLookupUuidFor.uuid)
    if (!tag) {
      return undefined
    }
    const parentId = tag.parentId
    if (parentId) {
      return this.tagDisplayController.items().find((displayableTag) => displayableTag.uuid === parentId)
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

  public getTagChildren(itemToLookupUuidFor: Models.SNTag): Models.SNTag[] {
    const tag = this.findItem<Models.SNTag>(itemToLookupUuidFor.uuid)
    if (!tag) {
      return []
    }

    const tags = this.collection.elementsReferencingElement(tag, ContentType.TYPES.Tag) as Models.SNTag[]

    return tags.filter((tag) => tag.parentId === itemToLookupUuidFor.uuid)
  }

  public getDeepTagChildren(itemToLookupUuidFor: Models.SNTag): Models.SNTag[] {
    const allChildren: Models.SNTag[] = []

    const children = this.getTagChildren(itemToLookupUuidFor)
    for (const child of children) {
      allChildren.push(child)
      allChildren.push(...this.getDeepTagChildren(child))
    }

    return allChildren
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
   * Get tags for a note sorted in natural order
   * @param item - The item whose tags will be returned
   * @returns Array containing tags associated with an item
   */
  public getSortedTagsForItem(item: Models.DecryptedItemInterface<Models.ItemContent>): Models.SNTag[] {
    return naturalSort(
      this.itemsReferencingItem(item).filter((ref) => {
        return ref?.content_type === ContentType.TYPES.Tag
      }) as Models.SNTag[],
      'title',
    )
  }

  public getUnsortedTagsForItem(item: Models.DecryptedItemInterface<Models.ItemContent>): Models.SNTag[] {
    return this.itemsReferencingItem(item).filter((ref) => {
      return ref?.content_type === ContentType.TYPES.Tag
    }) as Models.SNTag[]
  }

  public isSmartViewTitle(title: string): boolean {
    return title.startsWith(Models.SMART_TAG_DSL_PREFIX)
  }

  public notesMatchingSmartView(view: Models.SmartView): Models.SNNote[] {
    const criteria: Models.NotesAndFilesDisplayOptions = {
      views: [view],
    }

    return Models.notesAndFilesMatchingOptions(
      criteria,
      this.collection.allDecrypted(ContentType.TYPES.Note),
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
    return this.collection.all(ContentType.TYPES.Note).length
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

  /**
   * Important: Caller must coordinate with storage service separately to delete item from persistent database.
   */
  public removeItemFromMemory(item: Models.AnyItemInterface): void {
    this.removeItemsFromMemory([item])
  }

  /**
   * Important: Caller must coordinate with storage service separately to delete item from persistent database.
   */
  public removeItemsFromMemory(items: Models.AnyItemInterface[]): void {
    this.collection.discard(items)
    this.payloadManager.removePayloadLocally(items.map((item) => item.payload))

    const delta = Models.CreateItemDelta({ discarded: items as Models.DeletedItemInterface[] })
    const affectedContentTypes = items.map((item) => item.content_type)
    for (const controller of this.allDisplayControllers) {
      if (controller.contentTypes.some((ct) => affectedContentTypes.includes(ct))) {
        controller.onCollectionChange(delta)
      }
    }
  }

  public relationshipDirectionBetweenItems(
    itemA: Models.DecryptedItemInterface<Models.ItemContent>,
    itemB: Models.DecryptedItemInterface<Models.ItemContent>,
  ): ItemRelationshipDirection {
    const itemAReferencesItemB = !!itemA.references.find((reference) => reference.uuid === itemB.uuid)
    const itemBReferencesItemA = !!itemB.references.find((reference) => reference.uuid === itemA.uuid)

    return itemAReferencesItemB
      ? ItemRelationshipDirection.AReferencesB
      : itemBReferencesItemA
      ? ItemRelationshipDirection.BReferencesA
      : ItemRelationshipDirection.NoRelationship
  }

  public conflictsOf(uuid: string) {
    return this.collection.conflictsOf(uuid)
  }

  public numberOfNotesWithConflicts(): number {
    const uuids = this.collection.uuidsOfItemsWithConflicts()
    const items = this.navigationDisplayController.hasExclusiveVaultOptions()
      ? this.navigationDisplayController
          .items()
          .filter((item) => Models.isNote(item) && this.collection.uuidsOfItemsWithConflicts().includes(item.uuid))
      : this.findItems(uuids).filter(Models.isNote)
    return items.length
  }

  getItemLinkedFiles(item: Models.DecryptedItemInterface): Models.FileItem[] {
    return item.content_type === ContentType.TYPES.File
      ? this.referencesForItem(item).filter(Models.isFile)
      : this.itemsReferencingItem(item).filter(Models.isFile)
  }

  getItemLinkedNotes(item: Models.DecryptedItemInterface<Models.ItemContent>): Models.SNNote[] {
    return this.referencesForItem(item).filter(Models.isNote)
  }

  /**
   * Begin streaming items to display in the UI. The stream callback will be called
   * immediately with the present items that match the constraint, and over time whenever
   * items matching the constraint are added, changed, or deleted.
   */
  public streamItems<I extends Models.DecryptedItemInterface = Models.DecryptedItemInterface>(
    contentType: string | string[],
    stream: Models.ItemStream<I>,
  ): () => void {
    const removeItemManagerObserver = this.addObserver<I>(contentType, ({ changed, inserted, removed, source }) => {
      stream({ changed, inserted, removed, source })
    })

    const matches = this.getItems<I>(contentType)
    stream({
      inserted: matches,
      changed: [],
      removed: [],
      source: Models.PayloadEmitSource.InitialObserverRegistrationPush,
    })

    this.streamDisposers.push(removeItemManagerObserver)

    return () => {
      removeItemManagerObserver()

      removeFromArray(this.streamDisposers, removeItemManagerObserver)
    }
  }
}
