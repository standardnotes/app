import { PlainEditorInterface } from '../../PlainEditor/PlainEditor'
import { findStringMatches } from '../findStringMatches'
import {
  TextRange,
  UniversalSearchProvider,
  UniversalSearchQuery,
  UniversalSearchReplaceQuery,
  UniversalSearchResult,
} from '../types'

function toSearchResults(matches: TextRange[]): UniversalSearchResult<TextRange>[] {
  return matches.map((match) => ({
    id: `plain-${match.start}`,
    payload: match,
  }))
}

type CreatePlainEditorUniversalSearchProviderOptions = {
  getEditor: () => PlainEditorInterface | undefined
  /** Read lazily so the controller does not need to be rebuilt when the note's locked state changes. */
  getLocked: () => boolean
}

export function createPlainEditorUniversalSearchProvider({
  getEditor,
  getLocked,
}: CreatePlainEditorUniversalSearchProviderOptions): UniversalSearchProvider<TextRange> {
  const searchText = (query: UniversalSearchQuery): UniversalSearchResult<TextRange>[] => {
    const text = getEditor()?.getText() ?? ''
    return toSearchResults(findStringMatches(text, query.query, query.isCaseSensitive))
  }

  return {
    id: 'plain-editor',
    get capabilities() {
      return {
        supportsReplace: !getLocked(),
        supportsHighlightAll: true,
      }
    },
    search: searchText,
    selectResult: (result, options) => {
      const payload = result.payload
      if (!payload) {
        return
      }

      getEditor()?.setSelection(payload.start, payload.end, {
        focus: false,
        scrollIntoView: options?.scrollIntoView ?? false,
      })
    },
    clear: () => {
      return
    },
    replaceCurrentResult: async (result, query: UniversalSearchReplaceQuery) => {
      const payload = result.payload
      if (!payload) {
        return searchText(query)
      }

      await getEditor()?.replaceRange(payload.start, payload.end, query.replaceQuery)
      return searchText(query)
    },
    replaceAllResults: async (results, query: UniversalSearchReplaceQuery) => {
      const ranges = results
        .map((result) => result.payload)
        .filter((payload): payload is TextRange => payload != undefined)

      await getEditor()?.replaceAllRanges(ranges, query.replaceQuery)
      return searchText(query)
    },
  }
}
