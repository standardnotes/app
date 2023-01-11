export type SuperSearchResult = {
  node: Text
  startIndex: number
  endIndex: number
}

export type SuperSearchContextState = {
  query: string
  results: SuperSearchResult[]
  currentResultIndex: number
  isCaseSensitive: boolean
}

export type SuperSearchContextAction =
  | { type: 'set-query'; query: string }
  | { type: 'set-results'; results: SuperSearchResult[] }
  | { type: 'clear-results' }
  | { type: 'set-current-result-index'; index: number }
  | { type: 'go-to-next-result' }
  | { type: 'go-to-previous-result' }
  | { type: 'set-case-sensitive'; isCaseSensitive: boolean }
  | { type: 'reset-search' }

export type SuperSearchReplaceEvent = {
  type: 'next' | 'all'
  replace: string
}
