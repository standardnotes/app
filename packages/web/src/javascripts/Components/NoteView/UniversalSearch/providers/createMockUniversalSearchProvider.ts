import { applyTextReplacements } from '../applyTextReplacements'
import { findStringMatches } from '../findStringMatches'
import {
  TextRange,
  UniversalSearchProvider,
  UniversalSearchQuery,
  UniversalSearchReplaceQuery,
  UniversalSearchResult,
} from '../types'

export type MockTextMatchPayload = TextRange & {
  documentId: string
}

export type MockUniversalSearchDocument = {
  id: string
  text: string
}

type CreateMockUniversalSearchProviderOptions = {
  documents: MockUniversalSearchDocument[]
  onSelectResult?: (result: UniversalSearchResult<MockTextMatchPayload>) => void
}

export function createMockUniversalSearchProvider({
  documents,
  onSelectResult,
}: CreateMockUniversalSearchProviderOptions): UniversalSearchProvider<MockTextMatchPayload> & {
  getDocuments: () => MockUniversalSearchDocument[]
} {
  const docs = documents.map((document) => ({ ...document }))

  const searchDocuments = (query: UniversalSearchQuery): UniversalSearchResult<MockTextMatchPayload>[] => {
    const results: UniversalSearchResult<MockTextMatchPayload>[] = []

    for (const document of docs) {
      const matches = findStringMatches(document.text, query.query, query.isCaseSensitive)
      for (const match of matches) {
        results.push({
          id: `${document.id}-${match.start}`,
          payload: {
            start: match.start,
            end: match.end,
            documentId: document.id,
          },
        })
      }
    }

    return results
  }

  const replaceMatch = (documentId: string, start: number, end: number, replaceQuery: string): void => {
    const document = docs.find((doc) => doc.id === documentId)
    if (!document) {
      return
    }

    document.text = document.text.slice(0, start) + replaceQuery + document.text.slice(end)
  }

  return {
    id: 'mock',
    capabilities: {
      supportsSearch: true,
      supportsReplace: true,
      supportsHighlightAll: false,
    },
    search: searchDocuments,
    selectResult: (result) => {
      onSelectResult?.(result)
    },
    clear: () => {
      return
    },
    replaceCurrentResult: (result, query: UniversalSearchReplaceQuery) => {
      const payload = result.payload
      if (!payload) {
        return searchDocuments(query)
      }

      replaceMatch(payload.documentId, payload.start, payload.end, query.replaceQuery)
      return searchDocuments(query)
    },
    replaceAllResults: (results, query: UniversalSearchReplaceQuery) => {
      const matchesByDocument = new Map<string, TextRange[]>()

      for (const result of results) {
        const payload = result.payload
        if (!payload) {
          continue
        }

        const documentMatches = matchesByDocument.get(payload.documentId) ?? []
        documentMatches.push({ start: payload.start, end: payload.end })
        matchesByDocument.set(payload.documentId, documentMatches)
      }

      for (const [documentId, ranges] of matchesByDocument) {
        const document = docs.find((doc) => doc.id === documentId)
        if (!document) {
          continue
        }

        document.text = applyTextReplacements(document.text, ranges, query.replaceQuery)
      }

      return searchDocuments(query)
    },
    getDocuments: () => docs,
  }
}
