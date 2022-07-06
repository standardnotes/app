import { ContentType } from '@standardnotes/common'
import { ChallengeReason, SyncOptions } from '@standardnotes/services'
import { TransactionalMutation } from '../Items'
import * as Models from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { BackupFile } from '@standardnotes/encryption'

export interface MutatorClientInterface {
  /**
   * Inserts the input item by its payload properties, and marks the item as dirty.
   * A sync is not performed after an item is inserted. This must be handled by the caller.
   */
  insertItem(item: Models.DecryptedItemInterface): Promise<Models.DecryptedItemInterface>

  /**
   * Mutates a pre-existing item, marks it as dirty, and syncs it
   */
  changeAndSaveItem<M extends Models.DecryptedItemMutator = Models.DecryptedItemMutator>(
    itemToLookupUuidFor: Models.DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
    emitSource?: Models.PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<Models.DecryptedItemInterface | undefined>

  /**
   * Mutates pre-existing items, marks them as dirty, and syncs
   */
  changeAndSaveItems<M extends Models.DecryptedItemMutator = Models.DecryptedItemMutator>(
    itemsToLookupUuidsFor: Models.DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
    emitSource?: Models.PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<void>

  /**
   * Mutates a pre-existing item and marks it as dirty. Does not sync changes.
   */
  changeItem<M extends Models.DecryptedItemMutator>(
    itemToLookupUuidFor: Models.DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
  ): Promise<Models.DecryptedItemInterface | undefined>

  /**
   * Mutates a pre-existing items and marks them as dirty. Does not sync changes.
   */
  changeItems<M extends Models.DecryptedItemMutator = Models.DecryptedItemMutator>(
    itemsToLookupUuidsFor: Models.DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
  ): Promise<(Models.DecryptedItemInterface | undefined)[]>

  /**
   * Run unique mutations per each item in the array, then only propagate all changes
   * once all mutations have been run. This differs from `changeItems` in that changeItems
   * runs the same mutation on all items.
   */
  runTransactionalMutations(
    transactions: TransactionalMutation[],
    emitSource?: Models.PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<(Models.DecryptedItemInterface | undefined)[]>

  runTransactionalMutation(
    transaction: TransactionalMutation,
    emitSource?: Models.PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<Models.DecryptedItemInterface | undefined>

  protectItems<
    _M extends Models.DecryptedItemMutator<Models.ItemContent>,
    I extends Models.DecryptedItemInterface<Models.ItemContent>,
  >(
    items: I[],
  ): Promise<I[]>

  unprotectItems<
    _M extends Models.DecryptedItemMutator<Models.ItemContent>,
    I extends Models.DecryptedItemInterface<Models.ItemContent>,
  >(
    items: I[],
    reason: ChallengeReason,
  ): Promise<I[] | undefined>

  protectNote(note: Models.SNNote): Promise<Models.SNNote>

  unprotectNote(note: Models.SNNote): Promise<Models.SNNote | undefined>

  protectNotes(notes: Models.SNNote[]): Promise<Models.SNNote[]>

  unprotectNotes(notes: Models.SNNote[]): Promise<Models.SNNote[]>

  protectFile(file: Models.FileItem): Promise<Models.FileItem>

  unprotectFile(file: Models.FileItem): Promise<Models.FileItem | undefined>

  /**
   * Takes the values of the input item and emits it onto global state.
   */
  mergeItem(
    item: Models.DecryptedItemInterface,
    source: Models.PayloadEmitSource,
  ): Promise<Models.DecryptedItemInterface>

  /**
   * Creates an unmanaged item that can be added later.
   */
  createTemplateItem<
    C extends Models.ItemContent = Models.ItemContent,
    I extends Models.DecryptedItemInterface<C> = Models.DecryptedItemInterface<C>,
  >(
    contentType: ContentType,
    content?: C,
  ): I

  /**
   * @param isUserModified  Whether to change the modified date the user
   * sees of the item.
   */
  setItemNeedsSync(
    item: Models.DecryptedItemInterface,
    isUserModified?: boolean,
  ): Promise<Models.DecryptedItemInterface | undefined>

  setItemsNeedsSync(items: Models.DecryptedItemInterface[]): Promise<(Models.DecryptedItemInterface | undefined)[]>

  deleteItem(item: Models.DecryptedItemInterface | Models.EncryptedItemInterface): Promise<void>

  deleteItems(items: (Models.DecryptedItemInterface | Models.EncryptedItemInterface)[]): Promise<void>

  emptyTrash(): Promise<void>

  duplicateItem<T extends Models.DecryptedItemInterface>(item: T, additionalContent?: Partial<T['content']>): Promise<T>

  /**
   * Migrates any tags containing a '.' character to sa chema-based heirarchy, removing
   * the dot from the tag's title.
   */
  migrateTagsToFolders(): Promise<unknown>

  /**
   * Establishes a hierarchical relationship between two tags.
   */
  setTagParent(parentTag: Models.SNTag, childTag: Models.SNTag): Promise<void>

  /**
   * Remove the tag parent.
   */
  unsetTagParent(childTag: Models.SNTag): Promise<void>

  findOrCreateTag(title: string): Promise<Models.SNTag>

  /** Creates and returns the tag but does not run sync. Callers must perform sync. */
  createTagOrSmartView(title: string): Promise<Models.SNTag | Models.SmartView>

  /**
   * Activates or deactivates a component, depending on its
   * current state, and syncs.
   */
  toggleComponent(component: Models.SNComponent): Promise<void>

  toggleTheme(theme: Models.SNComponent): Promise<void>

  /**
   * @returns
   * .affectedItems: Items that were either created or dirtied by this import
   * .errorCount: The number of items that were not imported due to failure to decrypt.
   */
  importData(
    data: BackupFile,
    awaitSync?: boolean,
  ): Promise<
    | {
        affectedItems: Models.DecryptedItemInterface[]
        errorCount: number
      }
    | {
        error: ClientDisplayableError
      }
  >
}
