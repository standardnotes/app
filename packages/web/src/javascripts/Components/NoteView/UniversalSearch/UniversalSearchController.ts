import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import {
  UniversalSearchProvider,
  UniversalSearchResult,
  UniversalSearchResultPayload,
  UniversalSearchStatus,
} from './types'

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

function statusForEmptyQuery(provider: UniversalSearchProvider): UniversalSearchStatus {
  return provider.capabilities.supportsSearch ? 'idle' : 'ready'
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Search failed'
}

interface UniversalSearchControllerOptions<TPayload = UniversalSearchResultPayload> {
  provider: UniversalSearchProvider<TPayload>
  isEnabled?: boolean
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
  private isEnabled: boolean

  constructor(
    public readonly provider: UniversalSearchProvider<TPayload>,
    options: Omit<UniversalSearchControllerOptions<TPayload>, 'provider'> = {},
  ) {
    this.isEnabled = options.isEnabled ?? true
    this.shouldHighlightAll = provider.capabilities.supportsHighlightAll

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
    this.searchId++
    void this.provider.clear()
    this.results = []
  }

  open = (): void => {
    if (!this.isEnabled) {
      return
    }

    this.isOpen = true
    void this.search()
  }

  close = (): void => {
    void this.selectCurrentResult()
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
    this.shouldHighlightAll = this.provider.capabilities.supportsHighlightAll
  }

  setQuery = (query: string): void => {
    this.query = query
    void this.search()
  }

  setReplaceQuery = (replaceQuery: string): void => {
    this.replaceQuery = replaceQuery
  }

  toggleCaseSensitivity = (): void => {
    this.isCaseSensitive = !this.isCaseSensitive
    void this.search()
  }

  toggleReplaceMode = (): void => {
    this.isReplaceMode = !this.isReplaceMode
  }

  setShouldHighlightAll = (shouldHighlightAll: boolean): void => {
    this.shouldHighlightAll = this.provider.capabilities.supportsHighlightAll && shouldHighlightAll
  }

  goToNextResult = (): void => {
    this.currentResultIndex = getNextUniversalSearchResultIndex(this.currentResultIndex, this.results.length)
    void this.selectCurrentResult()
  }

  goToPreviousResult = (): void => {
    this.currentResultIndex = getPreviousUniversalSearchResultIndex(this.currentResultIndex, this.results.length)
    void this.selectCurrentResult()
  }

  selectCurrentResult = async (): Promise<void> => {
    const result = this.currentResult
    if (!result) {
      return
    }

    await this.provider.selectResult(result)
  }

  replaceCurrentResult = async (): Promise<void> => {
    if (!this.provider.capabilities.supportsReplace || !this.provider.replaceCurrentResult) {
      return
    }

    const result = this.currentResult
    if (!result || !this.replaceQuery) {
      return
    }

    const nextResults = await this.provider.replaceCurrentResult(result, {
      query: this.query,
      isCaseSensitive: this.isCaseSensitive,
      replaceQuery: this.replaceQuery,
    })

    await this.handleReplaceResult(nextResults)
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

  private search = async (): Promise<void> => {
    if (!this.isOpen || !this.isEnabled) {
      return
    }

    const searchId = this.searchId + 1
    this.searchId = searchId

    if (!this.query || !this.provider.capabilities.supportsSearch) {
      void this.provider.clear()
      this.clearResults(statusForEmptyQuery(this.provider))
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
        this.setSearchResults(results)
      })

      await this.selectCurrentResult()
    } catch (error) {
      if (searchId !== this.searchId) {
        return
      }

      runInAction(() => {
        this.setSearchError(errorMessage(error))
      })
    }
  }

  private handleReplaceResult = async (nextResults: UniversalSearchResult<TPayload>[] | void): Promise<void> => {
    if (Array.isArray(nextResults)) {
      runInAction(() => {
        this.setSearchResults(nextResults)
      })
      return
    }

    const results = await this.provider.search({
      query: this.query,
      isCaseSensitive: this.isCaseSensitive,
    })

    runInAction(() => {
      this.setSearchResults(results)
    })
  }

  private setSearchResults(results: UniversalSearchResult<TPayload>[]): void {
    this.results = results
    this.currentResultIndex = results.length > 0 ? 0 : -1
    this.status = 'ready'
    this.error = undefined
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
