export type UniversalSearchStatus = 'idle' | 'loading' | 'ready' | 'error'

export type UniversalSearchResultPayload = unknown

export interface UniversalSearchQuery {
  query: string
  isCaseSensitive: boolean
}

export interface UniversalSearchReplaceQuery extends UniversalSearchQuery {
  replaceQuery: string
}

export interface UniversalSearchResult<TPayload = UniversalSearchResultPayload> {
  id: string
  label?: string
  context?: string
  payload?: TPayload
}

export interface UniversalSearchProviderCapabilities {
  supportsSearch: boolean
  supportsReplace: boolean
  supportsHighlightAll: boolean
}

export interface UniversalSearchProvider<TPayload = UniversalSearchResultPayload> {
  id: string
  capabilities: UniversalSearchProviderCapabilities
  search(query: UniversalSearchQuery): Promise<UniversalSearchResult<TPayload>[]> | UniversalSearchResult<TPayload>[]
  selectResult(result: UniversalSearchResult<TPayload>): Promise<void> | void
  clear(): Promise<void> | void
  replaceCurrentResult?(
    result: UniversalSearchResult<TPayload>,
    query: UniversalSearchReplaceQuery,
  ): Promise<UniversalSearchResult<TPayload>[]> | UniversalSearchResult<TPayload>[] | Promise<void> | void
  replaceAllResults?(
    results: UniversalSearchResult<TPayload>[],
    query: UniversalSearchReplaceQuery,
  ): Promise<UniversalSearchResult<TPayload>[]> | UniversalSearchResult<TPayload>[] | Promise<void> | void
}

export interface UniversalSearchControllerState<TPayload = UniversalSearchResultPayload> {
  isOpen: boolean
  query: string
  replaceQuery: string
  results: UniversalSearchResult<TPayload>[]
  currentResultIndex: number
  status: UniversalSearchStatus
  error?: string
  isCaseSensitive: boolean
  isReplaceMode: boolean
  shouldHighlightAll: boolean
}
