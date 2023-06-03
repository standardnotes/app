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
  DecryptedPayload,
  SNTag,
  VaultItemsKeyInterface,
  ItemInterface,
  AnyItemInterface,
  VaultKeyCopyInterface,
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
  setItemToBeDeleted(itemToLookupUuidFor: DecryptedItemInterface, source?: PayloadEmitSource): Promise<void>
  setItemsToBeDeleted(itemsToLookupUuidsFor: DecryptedItemInterface[]): Promise<void>
  setItemsDirty(
    itemsToLookupUuidsFor: DecryptedItemInterface[],
    isUserModified?: boolean,
  ): Promise<DecryptedItemInterface[]>
  get items(): DecryptedItemInterface[]
  insertItem<T extends DecryptedItemInterface>(item: DecryptedItemInterface): Promise<T>
  emitItemFromPayload(payload: DecryptedPayloadInterface, source: PayloadEmitSource): Promise<DecryptedItemInterface>
  getItems<T extends DecryptedItemInterface>(contentType: ContentType | ContentType[]): T[]
  allTrackedItems(): ItemInterface[]
  getDisplayableItemsKeys(): ItemsKeyInterface[]
  createItem<T extends DecryptedItemInterface, C extends ItemContent = ItemContent>(
    contentType: ContentType,
    content: C,
    needsSync?: boolean,
    vaultUuid?: string,
  ): Promise<T>
  createTemplateItem<
    C extends ItemContent = ItemContent,
    I extends DecryptedItemInterface<C> = DecryptedItemInterface<C>,
  >(
    contentType: ContentType,
    content?: C,
    override?: Partial<DecryptedPayload<C>>,
  ): I
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
  removeAllItemsFromMemory(): Promise<void>
  removeItemsLocally(items: AnyItemInterface[]): void
  getDirtyItems(): (DecryptedItemInterface | DeletedItemInterface)[]
  getTagLongTitle(tag: SNTag): string
  getSortedTagsForItem(item: DecryptedItemInterface<ItemContent>): SNTag[]
  itemsReferencingItem<I extends DecryptedItemInterface = DecryptedItemInterface>(
    itemToLookupUuidFor: { uuid: string },
    contentType?: ContentType,
  ): I[]
  referencesForItem<I extends DecryptedItemInterface = DecryptedItemInterface>(
    itemToLookupUuidFor: DecryptedItemInterface,
    contentType?: ContentType,
  ): I[]
  findItem<T extends DecryptedItemInterface = DecryptedItemInterface>(uuid: string): T | undefined
  findSureItem<T extends DecryptedItemInterface = DecryptedItemInterface>(uuid: string): T

  getAllVaultItemsKeysForVault(keySystemIdentifier: string): VaultItemsKeyInterface[]
  getPrimaryVaultItemsKeyForVault(keySystemIdentifier: string): VaultItemsKeyInterface
  getAllSyncedVaultKeyCopiesForVault(keySystemIdentifier: string): VaultKeyCopyInterface[]
  getSyncedVaultKeyCopyMatchingTimestamp(
    keySystemIdentifier: string,
    timestamp: number,
  ): VaultKeyCopyInterface | undefined
  getPrimarySyncedVaultKeyCopy(keySystemIdentifier: string): VaultKeyCopyInterface | undefined
  itemsBelongingToKeySystem(keySystemIdentifier: string): DecryptedItemInterface[]
}
