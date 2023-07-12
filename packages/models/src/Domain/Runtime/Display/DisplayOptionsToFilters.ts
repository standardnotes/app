import { DecryptedItem } from '../../Abstract/Item'
import { SNTag } from '../../Syncable/Tag'
import { CompoundPredicate } from '../Predicate/CompoundPredicate'
import { ItemWithTags } from './Search/ItemWithTags'
import { itemMatchesQuery, itemPassesFilters } from './Search/SearchUtilities'
import { ItemFilter, ReferenceLookupCollection, SearchableDecryptedItem } from './Search/Types'
import { NotesAndFilesDisplayOptions } from './DisplayOptions'
import { SystemViewId } from '../../Syncable/SmartView'
import { ContentType } from '@standardnotes/domain-core'

export function computeUnifiedFilterForDisplayOptions(
  options: NotesAndFilesDisplayOptions,
  collection: ReferenceLookupCollection,
  additionalFilters: ItemFilter[] = [],
): ItemFilter {
  const filters = computeFiltersForDisplayOptions(options, collection).concat(additionalFilters)

  return (item: SearchableDecryptedItem) => {
    return itemPassesFilters(item, filters)
  }
}

export function computeFiltersForDisplayOptions(
  options: NotesAndFilesDisplayOptions,
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
          collection.elementsReferencingElement(item, ContentType.TYPES.Tag) as SNTag[],
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

  if (
    !viewsPredicate?.keypathIncludesString('conflict_of') &&
    !options.views?.some((v) => v.uuid === SystemViewId.TrashedNotes)
  ) {
    filters.push((item) => !item.conflictOf)
  }

  return filters
}
