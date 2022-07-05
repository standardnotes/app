import { ContentType } from '@standardnotes/common'
import {
  MutationType,
  ItemsKeyInterface,
  ItemsKeyMutatorInterface,
  DecryptedItemInterface,
  DecryptedItemMutator,
  DecryptedPayloadInterface,
  PayloadEmitSource,
  EncryptedItemInterface,
  DeletedItemInterface,
  ItemContent,
  PredicateInterface,
} from '@standardnotes/models'
import { AbstractService } from '../Service/AbstractService'

export type ItemManagerChangeData<I extends DecryptedItemInterface = DecryptedItemInterface> = {
  /** The items are pre-existing but have been changed */
  changed: I[]

  /** The items have been newly inserted */
  inserted: I[]

  /** The items should no longer be displayed in the interface, either due to being deleted, or becoming error-encrypted */
  removed: (EncryptedItemInterface | DeletedItemInterface)[]

  /** Items for which encrypted overwrite protection is enabled and enacted */
  ignored: EncryptedItemInterface[]

  /** Items which were previously error decrypting but now successfully decrypted */
  unerrored: I[]

  source: PayloadEmitSource
  sourceKey?: string
}

export type ItemManagerChangeObserverCallback<I extends DecryptedItemInterface = DecryptedItemInterface> = (
  data: ItemManagerChangeData<I>,
) => void

export interface ItemManagerInterface extends AbstractService {
  addObserver<I extends DecryptedItemInterface = DecryptedItemInterface>(
    contentType: ContentType | ContentType[],
    callback: ItemManagerChangeObserverCallback<I>,
  ): () => void

  /**
   * Marks the item as deleted and needing sync.
   */
  setItemToBeDeleted(itemToLookupUuidFor: DecryptedItemInterface, source?: PayloadEmitSource): Promise<void>

  setItemsToBeDeleted(itemsToLookupUuidsFor: DecryptedItemInterface[]): Promise<void>

  setItemsDirty(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    isUserModified?: boolean,
  ): Promise<DecryptedItemInterface[]>

  get items(): DecryptedItemInterface[]

  /**
   * Inserts the item as-is by reading its payload value. This function will not
   * modify item in any way (such as marking it as dirty). It is up to the caller
   * to pass in a dirtied item if that is their intention.
   */
  insertItem(item: DecryptedItemInterface): Promise<DecryptedItemInterface>

  emitItemFromPayload(payload: DecryptedPayloadInterface, source: PayloadEmitSource): Promise<DecryptedItemInterface>

  getItems<T extends DecryptedItemInterface>(contentType: ContentType | ContentType[]): T[]

  /**
   * Returns all non-deleted items keys
   */
  getDisplayableItemsKeys(): ItemsKeyInterface[]

  /**
   * Creates an item and conditionally maps it and marks it as dirty.
   * @param needsSync - Whether to mark the item as needing sync
   */
  createItem<T extends DecryptedItemInterface, C extends ItemContent = ItemContent>(
    contentType: ContentType,
    content: C,
    needsSync?: boolean,
  ): Promise<T>

  /**
   * Create an unmanaged item that can later be inserted via `insertItem`
   */
  createTemplateItem<
    C extends ItemContent = ItemContent,
    I extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    contentType: ContentType,
    content?: C,
  ): I

  /**
   * Consumers wanting to modify an item should run it through this block,
   * so that data is properly mapped through our function, and latest state
   * is properly reconciled.
   */
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

  changeItemsKey(
    itemToLookupUuidFor: ItemsKeyInterface,
    mutate: (mutator: ItemsKeyMutatorInterface) => void,
    mutationType?: MutationType,
    emitSource?: PayloadEmitSource,
    payloadSourceKey?: string,
  ): Promise<ItemsKeyInterface>

  itemsMatchingPredicate<T extends DecryptedItemInterface>(
    contentType: ContentType,
    predicate: PredicateInterface<T>,
  ): T[]

  itemsMatchingPredicates<T extends DecryptedItemInterface>(
    contentType: ContentType,
    predicates: PredicateInterface<T>[],
  ): T[]

  subItemsMatchingPredicates<T extends DecryptedItemInterface>(items: T[], predicates: PredicateInterface<T>[]): T[]
}
