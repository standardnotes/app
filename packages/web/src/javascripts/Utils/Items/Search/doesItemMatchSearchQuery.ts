import { SNTag, WebApplicationInterface, DecryptedItemInterface, ItemContent } from '@standardnotes/snjs'

export function doesItemMatchSearchQuery(
  item: DecryptedItemInterface<ItemContent>,
  searchQuery: string,
  application: WebApplicationInterface,
) {
  const title = item instanceof SNTag ? application.items.getTagLongTitle(item) : item.title ?? ''
  const matchesQuery = title.toLowerCase().includes(searchQuery.toLowerCase())
  const isArchivedOrTrashed = item.archived || item.trashed
  const isValidSearchResult = matchesQuery && !isArchivedOrTrashed

  return isValidSearchResult
}
