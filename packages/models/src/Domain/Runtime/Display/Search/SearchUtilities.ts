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

/** do the expensive stuff once, not 10000 times */
export interface PreparedQuery {
  raw: string
  lowercase: string
  words: string[]
  quotedText: string | null
  isUuid: boolean
}

export function prepareSearchQuery(searchString: string): PreparedQuery {
  const lowercase = searchString.toLowerCase()
  return {
    raw: searchString,
    lowercase,
    words: lowercase.split(' '),
    quotedText: stringBetweenQuotes(lowercase),
    isUuid: stringIsUuid(lowercase),
  }
}

export function itemMatchesQuery(
  itemToMatch: SearchableDecryptedItem,
  searchQuery: SearchQuery,
  collection: ReferenceLookupCollection,
): boolean {
  const prepared = prepareSearchQuery(searchQuery.query)
  const shouldCheckForSomeTagMatches = searchQuery.shouldCheckForSomeTagMatches ?? true
  const itemTags = collection.elementsReferencingElement(itemToMatch, ContentType.TYPES.Tag) as SNTag[]
  const someTagsMatches =
    shouldCheckForSomeTagMatches &&
    itemTags.some((tag) => matchResultForPreparedQuery(tag, prepared) !== MatchResult.None)

  if (itemToMatch.protected && !searchQuery.includeProtectedNoteText) {
    const match = matchResultForPreparedQuery(itemToMatch, prepared)
    return match === MatchResult.Title || match === MatchResult.TitleAndText || someTagsMatches
  }

  return matchResultForPreparedQuery(itemToMatch, prepared) !== MatchResult.None || someTagsMatches
}

export function itemMatchesQueryPrepared(
  itemToMatch: SearchableDecryptedItem,
  searchQuery: SearchQuery,
  prepared: PreparedQuery,
  collection: ReferenceLookupCollection,
): boolean {
  const shouldCheckForSomeTagMatches = searchQuery.shouldCheckForSomeTagMatches ?? true
  const itemTags = collection.elementsReferencingElement(itemToMatch, ContentType.TYPES.Tag) as SNTag[]
  const someTagsMatches =
    shouldCheckForSomeTagMatches &&
    itemTags.some((tag) => matchResultForPreparedQuery(tag, prepared) !== MatchResult.None)

  if (itemToMatch.protected && !searchQuery.includeProtectedNoteText) {
    const match = matchResultForPreparedQuery(itemToMatch, prepared)
    return match === MatchResult.Title || match === MatchResult.TitleAndText || someTagsMatches
  }

  return matchResultForPreparedQuery(itemToMatch, prepared) !== MatchResult.None || someTagsMatches
}

function matchResultForPreparedQuery(item: SearchableItem, query: PreparedQuery): MatchResult {
  if (query.raw.length === 0) {
    return MatchResult.TitleAndText
  }

  const title = item.title?.toLowerCase()
  const text = item.text?.toLowerCase()

  if (query.quotedText) {
    return (
      (title?.includes(query.quotedText) ? MatchResult.Title : MatchResult.None) +
      (text?.includes(query.quotedText) ? MatchResult.Text : MatchResult.None)
    )
  }

  if (query.isUuid) {
    return item.uuid === query.lowercase ? MatchResult.Uuid : MatchResult.None
  }

  const matchesTitle =
    title &&
    query.words.every((word) => {
      return title.indexOf(word) >= 0
    })

  const matchesBody =
    text &&
    query.words.every((word) => {
      return text.indexOf(word) >= 0
    })

  return (matchesTitle ? MatchResult.Title : 0) + (matchesBody ? MatchResult.Text : 0)
}

const QUOTED_STRING_RE = /"(.*?)"/
const UUID_RE = /\b[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}\b/

function stringBetweenQuotes(text: string) {
  const matches = text.match(QUOTED_STRING_RE)
  return matches ? matches[1] : null
}

function stringIsUuid(text: string) {
  return UUID_RE.test(text)
}
