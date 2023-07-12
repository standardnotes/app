import {
  ComponentInterface,
  ComponentMutator,
  DecryptedItemInterface,
  DecryptedItemMutator,
  DecryptedPayloadInterface,
  EncryptedItemInterface,
  FeatureRepoMutator,
  FileItem,
  ItemContent,
  ItemsKeyInterface,
  ItemsKeyMutatorInterface,
  MutationType,
  PayloadEmitSource,
  PredicateInterface,
  SmartView,
  SNFeatureRepo,
  SNNote,
  SNTag,
  TransactionalMutation,
  VaultListingInterface,
} from '@standardnotes/models'

export interface MutatorClientInterface {
  /**
   * Inserts the input item by its payload properties, and marks the item as dirty.
   * A sync is not performed after an item is inserted. This must be handled by the caller.
   */
  insertItem<T extends DecryptedItemInterface>(item: DecryptedItemInterface, setDirty?: boolean): Promise<T>
  emitItemFromPayload(payload: DecryptedPayloadInterface, source: PayloadEmitSource): Promise<DecryptedItemInterface>

  setItemToBeDeleted(itemToLookupUuidFor: DecryptedItemInterface, source?: PayloadEmitSource): Promise<void>
  setItemsToBeDeleted(itemsToLookupUuidsFor: DecryptedItemInterface[]): Promise<void>
  setItemsDirty(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    isUserModified?: boolean,
  ): Promise<DecryptedItemInterface[]>
  createItem<T extends DecryptedItemInterface, C extends ItemContent = ItemContent>(
    contentType: string,
    content: C,
    needsSync?: boolean,
    vault?: VaultListingInterface,
  ): Promise<T>

  changeItem<
    M extends DecryptedItemMutator = DecryptedItemMutator,
    I extends DecryptedItemInterface = DecryptedItemInterface,
  >(
    itemToLookupUuidFor: I,
    mutate?: (mutator: M) => void,
    mutationType?: MutationType,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<I>
  changeItems<
    M extends DecryptedItemMutator = DecryptedItemMutator,
    I extends DecryptedItemInterface = DecryptedItemInterface,
  >(
    itemsToLookupUuidsFor: I[],
    mutate?: (mutator: M) => void,
    mutationType?: MutationType,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<I[]>

  changeItemsKey(
    itemToLookupUuidFor: ItemsKeyInterface,
    mutate: (mutator: ItemsKeyMutatorInterface) => void,
    mutationType?: MutationType,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<ItemsKeyInterface>

  changeComponent(
    itemToLookupUuidFor: ComponentInterface,
    mutate: (mutator: ComponentMutator) => void,
    mutationType?: MutationType,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<ComponentInterface>

  changeFeatureRepo(
    itemToLookupUuidFor: SNFeatureRepo,
    mutate: (mutator: FeatureRepoMutator) => void,
    mutationType?: MutationType,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<SNFeatureRepo>

  /**
   * Run unique mutations per each item in the array, then only propagate all changes
   * once all mutations have been run. This differs from `changeItems` in that changeItems
   * runs the same mutation on all items.
   */
  runTransactionalMutations(
    transactions: TransactionalMutation[],
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<(DecryptedItemInterface | undefined)[]>

  runTransactionalMutation(
    transaction: TransactionalMutation,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<DecryptedItemInterface | undefined>

  /**
   * Takes the values of the input item and emits it onto global state.
   */
  mergeItem(item: DecryptedItemInterface, source: PayloadEmitSource): Promise<DecryptedItemInterface>

  /**
   * @param isUserModified  Whether to change the modified date the user
   * sees of the item.
   */
  setItemNeedsSync(item: DecryptedItemInterface, isUserModified?: boolean): Promise<DecryptedItemInterface | undefined>

  setItemsNeedsSync(items: DecryptedItemInterface[]): Promise<(DecryptedItemInterface | undefined)[]>

  deleteItem(item: DecryptedItemInterface | EncryptedItemInterface): Promise<void>

  deleteItems(items: (DecryptedItemInterface | EncryptedItemInterface)[]): Promise<void>

  emptyTrash(): Promise<void>

  duplicateItem<T extends DecryptedItemInterface>(
    itemToLookupUuidFor: T,
    isConflict?: boolean,
    additionalContent?: Partial<T['content']>,
  ): Promise<T>

  addTagToNote(note: SNNote, tag: SNTag, addHierarchy: boolean): Promise<SNTag[] | undefined>

  /**
   * Migrates any tags containing a '.' character to sa chema-based heirarchy, removing
   * the dot from the tag's title.
   */
  migrateTagsToFolders(): Promise<unknown>

  /**
   * Establishes a hierarchical relationship between two tags.
   */
  setTagParent(parentTag: SNTag, childTag: SNTag): Promise<SNTag>

  /**
   * Remove the tag parent.
   */
  unsetTagParent(childTag: SNTag): Promise<SNTag>

  findOrCreateTag(title: string, createInVault?: VaultListingInterface): Promise<SNTag>

  /** Creates and returns the tag but does not run sync. Callers must perform sync. */
  createTagOrSmartView<T extends SNTag | SmartView>(title: string, vault?: VaultListingInterface): Promise<T>
  findOrCreateTagParentChain(titlesHierarchy: string[]): Promise<SNTag>

  associateFileWithNote(file: FileItem, note: SNNote): Promise<FileItem | undefined>

  disassociateFileWithNote(file: FileItem, note: SNNote): Promise<FileItem>
  renameFile(file: FileItem, name: string): Promise<FileItem>

  unlinkItems(
    itemA: DecryptedItemInterface<ItemContent>,
    itemB: DecryptedItemInterface<ItemContent>,
  ): Promise<DecryptedItemInterface<ItemContent>>
  createSmartView<T extends DecryptedItemInterface>(dto: {
    title: string
    predicate: PredicateInterface<T>
    iconString?: string
    vault?: VaultListingInterface
  }): Promise<SmartView>
  linkNoteToNote(note: SNNote, otherNote: SNNote): Promise<SNNote>
  linkFileToFile(file: FileItem, otherFile: FileItem): Promise<FileItem>
  addTagToFile(file: FileItem, tag: SNTag, addHierarchy: boolean): Promise<SNTag[] | undefined>
}
