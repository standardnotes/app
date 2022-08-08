import { ContentType } from '@standardnotes/common'
import {
  BackupFile,
  DecryptedItemInterface,
  DecryptedItemMutator,
  EncryptedItemInterface,
  FileItem,
  ItemContent,
  PayloadEmitSource,
  SmartView,
  SNComponent,
  SNNote,
  SNTag,
  TransactionalMutation,
} from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'

import { ChallengeReason } from '../Challenge/Types/ChallengeReason'
import { SyncOptions } from '../Sync/SyncOptions'

export interface MutatorClientInterface {
  /**
   * Inserts the input item by its payload properties, and marks the item as dirty.
   * A sync is not performed after an item is inserted. This must be handled by the caller.
   */
  insertItem(item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  /**
   * Mutates a pre-existing item, marks it as dirty, and syncs it
   */
  changeAndSaveItem<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemToLookupUuidFor: DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<DecryptedItemInterface | undefined>

  /**
   * Mutates pre-existing items, marks them as dirty, and syncs
   */
  changeAndSaveItems<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
    emitSource?: PayloadEmitSource,
    syncOptions?: SyncOptions,
  ): Promise<void>

  /**
   * Mutates a pre-existing item and marks it as dirty. Does not sync changes.
   */
  changeItem<M extends DecryptedItemMutator>(
    itemToLookupUuidFor: DecryptedItemInterface,
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
  ): Promise<DecryptedItemInterface | undefined>

  /**
   * Mutates a pre-existing items and marks them as dirty. Does not sync changes.
   */
  changeItems<M extends DecryptedItemMutator = DecryptedItemMutator>(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    mutate: (mutator: M) => void,
    updateTimestamps?: boolean,
  ): Promise<(DecryptedItemInterface | undefined)[]>

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

  protectItems<_M extends DecryptedItemMutator<ItemContent>, I extends DecryptedItemInterface<ItemContent>>(
    items: I[],
  ): Promise<I[]>

  unprotectItems<_M extends DecryptedItemMutator<ItemContent>, I extends DecryptedItemInterface<ItemContent>>(
    items: I[],
    reason: ChallengeReason,
  ): Promise<I[] | undefined>

  protectNote(note: SNNote): Promise<SNNote>

  unprotectNote(note: SNNote): Promise<SNNote | undefined>

  protectNotes(notes: SNNote[]): Promise<SNNote[]>

  unprotectNotes(notes: SNNote[]): Promise<SNNote[]>

  protectFile(file: FileItem): Promise<FileItem>

  unprotectFile(file: FileItem): Promise<FileItem | undefined>

  /**
   * Takes the values of the input item and emits it onto global state.
   */
  mergeItem(item: DecryptedItemInterface, source: PayloadEmitSource): Promise<DecryptedItemInterface>

  /**
   * Creates an unmanaged item that can be added later.
   */
  createTemplateItem<
    C extends ItemContent = ItemContent,
    I extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    contentType: ContentType,
    content?: C,
  ): I

  /**
   * @param isUserModified  Whether to change the modified date the user
   * sees of the item.
   */
  setItemNeedsSync(item: DecryptedItemInterface, isUserModified?: boolean): Promise<DecryptedItemInterface | undefined>

  setItemsNeedsSync(items: DecryptedItemInterface[]): Promise<(DecryptedItemInterface | undefined)[]>

  deleteItem(item: DecryptedItemInterface | EncryptedItemInterface): Promise<void>

  deleteItems(items: (DecryptedItemInterface | EncryptedItemInterface)[]): Promise<void>

  emptyTrash(): Promise<void>

  duplicateItem<T extends DecryptedItemInterface>(item: T, additionalContent?: Partial<T['content']>): Promise<T>

  /**
   * Migrates any tags containing a '.' character to sa chema-based heirarchy, removing
   * the dot from the tag's title.
   */
  migrateTagsToFolders(): Promise<unknown>

  /**
   * Establishes a hierarchical relationship between two tags.
   */
  setTagParent(parentTag: SNTag, childTag: SNTag): Promise<void>

  /**
   * Remove the tag parent.
   */
  unsetTagParent(childTag: SNTag): Promise<void>

  findOrCreateTag(title: string): Promise<SNTag>

  /** Creates and returns the tag but does not run sync. Callers must perform sync. */
  createTagOrSmartView(title: string): Promise<SNTag | SmartView>

  /**
   * Activates or deactivates a component, depending on its
   * current state, and syncs.
   */
  toggleComponent(component: SNComponent): Promise<void>

  toggleTheme(theme: SNComponent): Promise<void>

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
        affectedItems: DecryptedItemInterface[]
        errorCount: number
      }
    | {
        error: ClientDisplayableError
      }
  >
}
