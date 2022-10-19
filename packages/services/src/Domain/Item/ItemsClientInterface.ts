/* istanbul ignore file */

import { ContentType, Uuid } from '@standardnotes/common'
import {
  SNNote,
  FileItem,
  SNTag,
  SmartView,
  TagItemCountChangeObserver,
  DecryptedPayloadInterface,
  EncryptedItemInterface,
  DecryptedTransferPayload,
  PredicateInterface,
  DecryptedItemInterface,
  SNComponent,
  SNTheme,
  DisplayOptions,
  ItemsKeyInterface,
  ItemContent,
} from '@standardnotes/models'

export interface ItemsClientInterface {
  get invalidItems(): EncryptedItemInterface[]

  associateFileWithNote(file: FileItem, note: SNNote): Promise<FileItem>

  disassociateFileWithNote(file: FileItem, note: SNNote): Promise<FileItem>

  renameFile(file: FileItem, name: string): Promise<FileItem>

  addTagToNote(note: SNNote, tag: SNTag, addHierarchy: boolean): Promise<SNTag[]>

  addTagToFile(file: FileItem, tag: SNTag, addHierarchy: boolean): Promise<SNTag[]>

  /** Creates an unmanaged, un-inserted item from a payload. */
  createItemFromPayload(payload: DecryptedPayloadInterface): DecryptedItemInterface

  createPayloadFromObject(object: DecryptedTransferPayload): DecryptedPayloadInterface

  get trashedItems(): SNNote[]

  setPrimaryItemDisplayOptions(options: DisplayOptions): void

  getDisplayableNotes(): SNNote[]

  getDisplayableTags(): SNTag[]

  getDisplayableItemsKeys(): ItemsKeyInterface[]

  getDisplayableFiles(): FileItem[]

  getDisplayableNotesAndFiles(): (SNNote | FileItem)[]

  getDisplayableComponents(): (SNComponent | SNTheme)[]

  getItems<T extends DecryptedItemInterface>(contentType: ContentType | ContentType[]): T[]

  notesMatchingSmartView(view: SmartView): SNNote[]

  addNoteCountChangeObserver(observer: TagItemCountChangeObserver): () => void

  allCountableNotesCount(): number

  countableNotesForTag(tag: SNTag | SmartView): number

  findTagByTitle(title: string): SNTag | undefined

  getTagPrefixTitle(tag: SNTag): string | undefined

  getTagLongTitle(tag: SNTag): string

  hasTagsNeedingFoldersMigration(): boolean

  referencesForItem(itemToLookupUuidFor: DecryptedItemInterface, contentType?: ContentType): DecryptedItemInterface[]

  itemsReferencingItem(itemToLookupUuidFor: DecryptedItemInterface, contentType?: ContentType): DecryptedItemInterface[]

  linkNoteToNote(note: SNNote, otherNote: SNNote): Promise<SNNote>
  linkFileToFile(file: FileItem, otherFile: FileItem): Promise<FileItem>

  unlinkItems(
    itemOne: DecryptedItemInterface<ItemContent>,
    itemTwo: DecryptedItemInterface<ItemContent>,
  ): Promise<DecryptedItemInterface<ItemContent>>

  /**
   * Finds tags with title or component starting with a search query and (optionally) not associated with a note
   * @param searchQuery - The query string to match
   * @param note - The note whose tags should be omitted from results
   * @returns Array containing tags matching search query and not associated with note
   */
  searchTags(searchQuery: string, note?: SNNote): SNTag[]

  isValidTagParent(parentTagToLookUpUuidFor: SNTag, childToLookUpUuidFor: SNTag): boolean

  /**
   * Returns the parent for a tag
   */
  getTagParent(itemToLookupUuidFor: SNTag): SNTag | undefined

  /**
   * Returns the hierarchy of parents for a tag
   * @returns Array containing all parent tags
   */
  getTagParentChain(itemToLookupUuidFor: SNTag): SNTag[]

  /**
   * Returns all descendants for a tag
   * @returns Array containing all descendant tags
   */
  getTagChildren(itemToLookupUuidFor: SNTag): SNTag[]

  /**
   * Get tags for a note sorted in natural order
   * @param item - The item whose tags will be returned
   * @returns Array containing tags associated with an item
   */
  getSortedTagsForItem(item: DecryptedItemInterface<ItemContent>): SNTag[]

  isSmartViewTitle(title: string): boolean

  getSmartViews(): SmartView[]

  getNoteCount(): number

  /**
   * Finds an item by UUID.
   */
  findItem<T extends DecryptedItemInterface = DecryptedItemInterface>(uuid: Uuid): T | undefined

  /**
   * Finds an item by predicate.
   */
  findItems<T extends DecryptedItemInterface>(uuids: Uuid[]): T[]

  findSureItem<T extends DecryptedItemInterface = DecryptedItemInterface>(uuid: Uuid): T

  /**
   * Finds an item by predicate.
   */
  itemsMatchingPredicate<T extends DecryptedItemInterface>(
    contentType: ContentType,
    predicate: PredicateInterface<T>,
  ): T[]

  /**
   * @param item item to be checked
   * @returns Whether the item is a template (unmanaged)
   */
  isTemplateItem(item: DecryptedItemInterface): boolean
}
