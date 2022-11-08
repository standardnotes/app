import { WebApplicationInterface, naturalSort, ContentType } from '@standardnotes/snjs'
import { createLinkFromItem } from './createLinkFromItem'
import { doesItemMatchSearchQuery } from './doesItemMatchSearchQuery'
import { isSearchResultAlreadyLinkedToItem } from './isSearchResultAlreadyLinkedToItem'
import { isSearchResultExistingTag } from './isSearchResultExistingTag'
import { ItemLink } from './ItemLink'
import { LinkableItem } from './LinkableItem'

const ResultLimitPerContentType = 5
const MaxLinkedResults = 20

export function getLinkingSearchResults(
  searchQuery: string,
  application: WebApplicationInterface,
  activeItem?: LinkableItem,
  options: {
    contentType?: ContentType
    returnEmptyIfQueryEmpty?: boolean
  } = { returnEmptyIfQueryEmpty: true },
): {
  linkedResults: ItemLink<LinkableItem>[]
  linkedItems: LinkableItem[]
  unlinkedItems: LinkableItem[]
  shouldShowCreateTag: boolean
} {
  let unlinkedItems: LinkableItem[] = []
  const linkedItems: LinkableItem[] = []
  const linkedResults: ItemLink<LinkableItem>[] = []
  let shouldShowCreateTag = false

  const defaultReturnValue = {
    linkedResults,
    unlinkedItems,
    linkedItems,
    shouldShowCreateTag,
  }

  if (!activeItem) {
    return defaultReturnValue
  }

  if (!searchQuery.length && options.returnEmptyIfQueryEmpty) {
    return defaultReturnValue
  }

  const searchableItems = naturalSort(
    application.items.getItems([ContentType.Note, ContentType.File, ContentType.Tag]),
    'title',
  )

  const unlinkedTags: LinkableItem[] = []
  const unlinkedNotes: LinkableItem[] = []
  const unlinkedFiles: LinkableItem[] = []

  for (let index = 0; index < searchableItems.length; index++) {
    const item = searchableItems[index]

    if (activeItem?.uuid === item.uuid) {
      continue
    }

    if (options.contentType && item.content_type !== options.contentType) {
      continue
    }

    if (searchQuery.length && !doesItemMatchSearchQuery(item, searchQuery, application)) {
      continue
    }

    if (activeItem && isSearchResultAlreadyLinkedToItem(item, activeItem)) {
      if (linkedResults.length < MaxLinkedResults) {
        linkedResults.push(createLinkFromItem(item, 'linked'))
      }
      linkedItems.push(item)
      continue
    }

    const enforceResultLimit = options.contentType == null

    if (
      item.content_type === ContentType.Tag &&
      (!enforceResultLimit ||
        (unlinkedTags.length < ResultLimitPerContentType && item.content_type === ContentType.Tag))
    ) {
      unlinkedTags.push(item)
      continue
    }

    if (
      item.content_type === ContentType.Note &&
      (!enforceResultLimit || unlinkedNotes.length < ResultLimitPerContentType)
    ) {
      unlinkedNotes.push(item)
      continue
    }

    if (
      item.content_type === ContentType.File &&
      (!enforceResultLimit || unlinkedFiles.length < ResultLimitPerContentType)
    ) {
      unlinkedFiles.push(item)
      continue
    }
  }

  unlinkedItems = [...unlinkedTags, ...unlinkedNotes, ...unlinkedFiles]

  shouldShowCreateTag =
    !linkedResults.find((link) => isSearchResultExistingTag(link.item, searchQuery)) &&
    !unlinkedItems.find((item) => isSearchResultExistingTag(item, searchQuery))

  return {
    linkedResults,
    linkedItems,
    unlinkedItems,
    shouldShowCreateTag,
  }
}
