import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import {
  UniversalSearchProvider,
  UniversalSearchResult,
  UniversalSearchResultPayload,
  UniversalSearchStatus,
} from './types'

const DEFAULT_QUERY_DEBOUNCE_MS = 30
const DEFAULT_CONTENT_REFRESH_DEBOUNCE_MS = 250

export function getNextUniversalSearchResultIndex(currentResultIndex: number, resultCount: number): number {
  if (resultCount < 1) {
    return -1
  }

  const next = currentResultIndex + 1
  return next >= resultCount ? 0 : next
}

export function getPreviousUniversalSearchResultIndex(currentResultIndex: number, resultCount: number): number {
  if (resultCount < 1) {
    return -1
  }

  const previous = currentResultIndex - 1
  return previous < 0 ? resultCount - 1 : previous
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Search failed'
}

type SetSearchResultsOptions = {
  preferredIndex?: number
  selectResult?: boolean
  scrollIntoView?: boolean
}

interface UniversalSearchControllerOptions<TPayload = UniversalSearchResultPayload> {
  provider: UniversalSearchProvider<TPayload>
  /** Overridable mainly so tests can run searches synchronously; production uses the defaults below. */
  searchDebounceMs?: number
  contentSearchDebounceMs?: number
}

export class UniversalSearchController<TPayload = UniversalSearchResultPayload> {
  isOpen = false
  query = ''
  replaceQuery = ''
  results: UniversalSearchResult<TPayload>[] = []
  currentResultIndex = -1
  status: UniversalSearchStatus = 'idle'
  error: string | undefined = undefined
  isCaseSensitive = false
  isReplaceMode = false
  shouldHighlightAll: boolean

  private searchId = 0
  private searchDebounceMs: number
  private contentSearchDebounceMs: number
  private searchDebounceTimeout: ReturnType<typeof setTimeout> | undefined

  constructor(
    public readonly provider: UniversalSearchProvider<TPayload>,
    options: Omit<UniversalSearchControllerOptions<TPayload>, 'provider'> = {},
  ) {
    this.searchDebounceMs = options.searchDebounceMs ?? DEFAULT_QUERY_DEBOUNCE_MS
    this.contentSearchDebounceMs = options.contentSearchDebounceMs ?? DEFAULT_CONTENT_REFRESH_DEBOUNCE_MS
    this.shouldHighlightAll = provider.capabilities.supportsHighlightAll ? true : false

    makeObservable<this, 'setSearchResults' | 'setSearchError' | 'clearResults'>(this, {
      isOpen: observable,
      query: observable,
      replaceQuery: observable,
      results: observable,
      currentResultIndex: observable,
      status: observable,
      error: observable,
      isCaseSensitive: observable,
      isReplaceMode: observable,
      shouldHighlightAll: observable,

      currentResult: computed,

      open: action,
      close: action,
      resetContext: action,
      setQuery: action,
      setReplaceQuery: action,
      toggleCaseSensitivity: action,
      toggleReplaceMode: action,
      setShouldHighlightAll: action,
      goToNextResult: action,
      goToPreviousResult: action,
      setSearchResults: action,
      setSearchError: action,
      clearResults: action,
    })
  }

  get currentResult(): UniversalSearchResult<TPayload> | undefined {
    return this.results[this.currentResultIndex]
  }

  deinit(): void {
    this.cancelScheduledSearch()
    this.searchId++
    void this.provider.clear()
    this.results = []
  }

  open = (): void => {
    this.isOpen = true
    void this.executeSearch()
  }

  close = (): void => {
    void this.selectCurrentResult()
    this.clearSessionState()
  }

  resetContext = (): void => {
    this.clearSessionState()
  }

  setQuery = (query: string): void => {
    this.query = query

    if (!query) {
      this.cancelScheduledSearch()
      void this.executeSearch()
      return
    }

    this.scheduleSearch(this.searchDebounceMs)
  }

  refreshSearch = (): void => {
    if (!this.isOpen || !this.query) {
      return
    }

    this.scheduleSearch(this.contentSearchDebounceMs)
  }

  setReplaceQuery = (replaceQuery: string): void => {
    this.replaceQuery = replaceQuery
  }

  toggleCaseSensitivity = (): void => {
    if (!this.isOpen) {
      return
    }

    this.isCaseSensitive = !this.isCaseSensitive
    this.scheduleSearch(this.searchDebounceMs)
  }

  toggleReplaceMode = (): void => {
    this.isReplaceMode = !this.isReplaceMode
  }

  setShouldHighlightAll = (shouldHighlightAll: boolean): void => {
    this.shouldHighlightAll = this.provider.capabilities.supportsHighlightAll && shouldHighlightAll
  }

  goToNextResult = (): void => {
    this.currentResultIndex = getNextUniversalSearchResultIndex(this.currentResultIndex, this.results.length)
    void this.selectCurrentResult({ scrollIntoView: true })
  }

  goToPreviousResult = (): void => {
    this.currentResultIndex = getPreviousUniversalSearchResultIndex(this.currentResultIndex, this.results.length)
    void this.selectCurrentResult({ scrollIntoView: true })
  }

  selectCurrentResult = async (options?: { scrollIntoView?: boolean }): Promise<void> => {
    const result = this.currentResult
    if (!result) {
      return
    }

    await this.provider.selectResult(result, { scrollIntoView: options?.scrollIntoView ?? false })
  }

  replaceCurrentResult = async (): Promise<void> => {
    if (!this.provider.capabilities.supportsReplace || !this.provider.replaceCurrentResult) {
      return
    }

    const result = this.currentResult
    if (!result || !this.replaceQuery) {
      return
    }

    const indexBeforeReplace = this.currentResultIndex
    const nextResults = await this.provider.replaceCurrentResult(result, {
      query: this.query,
      isCaseSensitive: this.isCaseSensitive,
      replaceQuery: this.replaceQuery,
    })

    await this.handleReplaceResult(nextResults, { preferredIndex: indexBeforeReplace })
  }

  replaceAllResults = async (): Promise<void> => {
    if (!this.provider.capabilities.supportsReplace || !this.provider.replaceAllResults) {
      return
    }

    if (this.results.length < 1 || !this.replaceQuery) {
      return
    }

    const nextResults = await this.provider.replaceAllResults(this.results, {
      query: this.query,
      isCaseSensitive: this.isCaseSensitive,
      replaceQuery: this.replaceQuery,
    })

    await this.handleReplaceResult(nextResults)
  }

  private clearSessionState = (): void => {
    this.cancelScheduledSearch()
    this.searchId++
    void this.provider.clear()
    this.isOpen = false
    this.query = ''
    this.replaceQuery = ''
    this.results = []
    this.currentResultIndex = -1
    this.status = 'idle'
    this.error = undefined
    this.isCaseSensitive = false
    this.isReplaceMode = false
    this.shouldHighlightAll = this.provider.capabilities.supportsHighlightAll ? true : false
  }

  private cancelScheduledSearch = (): void => {
    if (this.searchDebounceTimeout) {
      clearTimeout(this.searchDebounceTimeout)
      this.searchDebounceTimeout = undefined
    }
  }

  private scheduleSearch = (debounceMs: number): void => {
    this.cancelScheduledSearch()

    if (debounceMs <= 0) {
      void this.executeSearch()
      return
    }

    this.searchDebounceTimeout = setTimeout(() => {
      this.searchDebounceTimeout = undefined
      void this.executeSearch()
    }, debounceMs)
  }

  private executeSearch = async (): Promise<void> => {
    if (!this.isOpen) {
      return
    }

    const searchId = this.searchId + 1
    this.searchId = searchId

    if (!this.query) {
      void this.provider.clear()
      this.clearResults('idle')
      return
    }

    this.status = 'loading'
    this.error = undefined

    try {
      const results = await this.provider.search({
        query: this.query,
        isCaseSensitive: this.isCaseSensitive,
      })

      if (searchId !== this.searchId) {
        return
      }

      runInAction(() => {
        this.setSearchResults(results, { selectResult: true, scrollIntoView: false })
      })
    } catch (error) {
      if (searchId !== this.searchId) {
        return
      }

      runInAction(() => {
        this.setSearchError(errorMessage(error))
      })
    }
  }

  private handleReplaceResult = async (
    nextResults: UniversalSearchResult<TPayload>[] | void,
    options?: Pick<SetSearchResultsOptions, 'preferredIndex'>,
  ): Promise<void> => {
    if (Array.isArray(nextResults)) {
      runInAction(() => {
        this.setSearchResults(nextResults, {
          preferredIndex: options?.preferredIndex,
          selectResult: true,
          scrollIntoView: true,
        })
      })
      return
    }

    const results = await this.provider.search({
      query: this.query,
      isCaseSensitive: this.isCaseSensitive,
    })

    runInAction(() => {
      this.setSearchResults(results, {
        preferredIndex: options?.preferredIndex,
        selectResult: true,
        scrollIntoView: true,
      })
    })
  }

  private setSearchResults(results: UniversalSearchResult<TPayload>[], options?: SetSearchResultsOptions): void {
    this.results = results

    if (results.length < 1) {
      this.currentResultIndex = -1
    } else if (options?.preferredIndex !== undefined) {
      this.currentResultIndex = Math.min(Math.max(0, options.preferredIndex), results.length - 1)
    } else {
      this.currentResultIndex = 0
    }

    this.status = 'ready'
    this.error = undefined

    if (options?.selectResult && this.currentResultIndex >= 0) {
      void this.selectCurrentResult({ scrollIntoView: options.scrollIntoView ?? false })
    }
  }

  private setSearchError(error: string): void {
    this.results = []
    this.currentResultIndex = -1
    this.status = 'error'
    this.error = error
  }

  private clearResults(status: UniversalSearchStatus): void {
    this.results = []
    this.currentResultIndex = -1
    this.status = status
    this.error = undefined
  }
}
