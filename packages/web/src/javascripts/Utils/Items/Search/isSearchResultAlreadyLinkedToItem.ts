import { LinkableItem } from './LinkableItem'

export function isSearchResultAlreadyLinkedToItem(searchResult: LinkableItem, item: LinkableItem): boolean {
  let isAlreadyLinked = false

  const isItemReferencedByActiveItem = item.references.some((ref) => ref.uuid === searchResult.uuid)
  const isActiveItemReferencedByItem = searchResult.references.some((ref) => ref.uuid === item?.uuid)

  if (item.content_type === searchResult.content_type) {
    isAlreadyLinked = isItemReferencedByActiveItem
  } else {
    isAlreadyLinked = isActiveItemReferencedByItem || isItemReferencedByActiveItem
  }

  return isAlreadyLinked
}
