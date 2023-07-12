import { ContentType } from '@standardnotes/domain-core'
import { SNTag } from '../../../Syncable/Tag'
import { NotesAndFilesDisplayOptions } from '../DisplayOptions'
import { computeFiltersForDisplayOptions } from '../DisplayOptionsToFilters'
import { SearchableItem } from './SearchableItem'
import { ReferenceLookupCollection, ItemFilter, SearchQuery, SearchableDecryptedItem } from './Types'

enum MatchResult {
  None = 0,
  Title = 1,
  Text = 2,
  TitleAndText = Title + Text,
  Uuid = 5,
}

export function notesAndFilesMatchingOptions(
  options: NotesAndFilesDisplayOptions,
  fromItems: SearchableDecryptedItem[],
  collection: ReferenceLookupCollection,
): SearchableItem[] {
  const filters = computeFiltersForDisplayOptions(options, collection)

  return fromItems.filter((item) => {
    return itemPassesFilters(item, filters)
  })
}
export function itemPassesFilters(item: SearchableDecryptedItem, filters: ItemFilter[]) {
  for (const filter of filters) {
    if (!filter(item)) {
      return false
    }
  }
  return true
}

export function itemMatchesQuery(
  itemToMatch: SearchableDecryptedItem,
  searchQuery: SearchQuery,
  collection: ReferenceLookupCollection,
): boolean {
  const itemTags = collection.elementsReferencingElement(itemToMatch, ContentType.TYPES.Tag) as SNTag[]
  const someTagsMatches = itemTags.some((tag) => matchResultForStringQuery(tag, searchQuery.query) !== MatchResult.None)

  if (itemToMatch.protected && !searchQuery.includeProtectedNoteText) {
    const match = matchResultForStringQuery(itemToMatch, searchQuery.query)
    return match === MatchResult.Title || match === MatchResult.TitleAndText || someTagsMatches
  }

  return matchResultForStringQuery(itemToMatch, searchQuery.query) !== MatchResult.None || someTagsMatches
}

function matchResultForStringQuery(item: SearchableItem, searchString: string): MatchResult {
  if (searchString.length === 0) {
    return MatchResult.TitleAndText
  }

  const title = item.title?.toLowerCase()
  const text = item.text?.toLowerCase()
  const lowercaseText = searchString.toLowerCase()
  const words = lowercaseText.split(' ')
  const quotedText = stringBetweenQuotes(lowercaseText)

  if (quotedText) {
    return (
      (title?.includes(quotedText) ? MatchResult.Title : MatchResult.None) +
      (text?.includes(quotedText) ? MatchResult.Text : MatchResult.None)
    )
  }

  if (stringIsUuid(lowercaseText)) {
    return item.uuid === lowercaseText ? MatchResult.Uuid : MatchResult.None
  }

  const matchesTitle =
    title &&
    words.every((word) => {
      return title.indexOf(word) >= 0
    })

  const matchesBody =
    text &&
    words.every((word) => {
      return text.indexOf(word) >= 0
    })

  return (matchesTitle ? MatchResult.Title : 0) + (matchesBody ? MatchResult.Text : 0)
}

function stringBetweenQuotes(text: string) {
  const matches = text.match(/"(.*?)"/)
  return matches ? matches[1] : null
}

function stringIsUuid(text: string) {
  const matches = text.match(/\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/)
  return matches ? true : false
}
