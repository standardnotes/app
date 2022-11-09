import { DecryptedItemInterface, ItemContent, ContentType } from '@standardnotes/snjs'

export function isSearchResultExistingTag(result: DecryptedItemInterface<ItemContent>, searchQuery: string) {
  return result.content_type === ContentType.Tag && result.title === searchQuery
}
