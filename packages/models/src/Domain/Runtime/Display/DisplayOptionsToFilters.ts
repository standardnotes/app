import { ContentType } from '@standardnotes/common'
import { DecryptedItem } from '../../Abstract/Item'
import { SNTag } from '../../Syncable/Tag'
import { CompoundPredicate } from '../Predicate/CompoundPredicate'
import { ItemWithTags } from './Search/ItemWithTags'
import { itemMatchesQuery, itemPassesFilters } from './Search/SearchUtilities'
import { ItemFilter, ReferenceLookupCollection, SearchableDecryptedItem } from './Search/Types'
import { FilterDisplayOptions } from './DisplayOptions'

export function computeUnifiedFilterForDisplayOptions(
  options: FilterDisplayOptions,
  collection: ReferenceLookupCollection,
): ItemFilter {
  const filters = computeFiltersForDisplayOptions(options, collection)

  return (item: SearchableDecryptedItem) => {
    return itemPassesFilters(item, filters)
  }
}

export function computeFiltersForDisplayOptions(
  options: FilterDisplayOptions,
  collection: ReferenceLookupCollection,
): ItemFilter[] {
  const filters: ItemFilter[] = []

  let viewsPredicate: CompoundPredicate<DecryptedItem> | undefined = undefined

  if (options.views && options.views.length > 0) {
    const compoundPredicate = new CompoundPredicate(
      'and',
      options.views.map((t) => t.predicate),
    )
    viewsPredicate = compoundPredicate

    filters.push((item) => {
      if (compoundPredicate.keypathIncludesString('tags')) {
        const noteWithTags = ItemWithTags.Create(
          item.payload,
          item,
          collection.elementsReferencingElement(item, ContentType.Tag) as SNTag[],
        )
        return compoundPredicate.matchesItem(noteWithTags)
      } else {
        return compoundPredicate.matchesItem(item)
      }
    })
  }

  if (options.tags && options.tags.length > 0) {
    for (const tag of options.tags) {
      filters.push((item) => tag.isReferencingItem(item))
    }
  }

  if (options.includePinned === false && !viewsPredicate?.keypathIncludesString('pinned')) {
    filters.push((item) => !item.pinned)
  }

  if (options.includeProtected === false && !viewsPredicate?.keypathIncludesString('protected')) {
    filters.push((item) => !item.protected)
  }

  if (options.includeTrashed === false && !viewsPredicate?.keypathIncludesString('trashed')) {
    filters.push((item) => !item.trashed)
  }

  if (options.includeArchived === false && !viewsPredicate?.keypathIncludesString('archived')) {
    filters.push((item) => !item.archived)
  }

  if (options.searchQuery) {
    const query = options.searchQuery
    filters.push((item) => itemMatchesQuery(item, query, collection))
  }

  return filters
}
