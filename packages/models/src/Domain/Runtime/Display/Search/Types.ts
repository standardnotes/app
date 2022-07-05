import { ItemCollection } from './../../Collection/Item/ItemCollection'
import { DecryptedItemInterface } from '../../../Abstract/Item'
import { SearchableItem } from './SearchableItem'

export type SearchQuery = {
  query: string
  includeProtectedNoteText: boolean
}

export interface ReferenceLookupCollection {
  elementsReferencingElement: ItemCollection['elementsReferencingElement']
}

export type SearchableDecryptedItem = SearchableItem & DecryptedItemInterface

export type ItemFilter = (item: SearchableDecryptedItem) => boolean
