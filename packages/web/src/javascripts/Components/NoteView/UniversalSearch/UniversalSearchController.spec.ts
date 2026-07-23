import { createMockUniversalSearchProvider } from './providers/createMockUniversalSearchProvider'
import {
  getNextUniversalSearchResultIndex,
  getPreviousUniversalSearchResultIndex,
  UniversalSearchController,
} from './UniversalSearchController'
import { UniversalSearchProvider } from './types'

const immediateSearchOptions = { searchDebounceMs: 0, contentSearchDebounceMs: 0 }

describe('UniversalSearchController', () => {
  async function flushSearch() {
    await Promise.resolve()
  }

  it('calculates predictable wraparound indexes', () => {
    expect(getNextUniversalSearchResultIndex(-1, 0)).toBe(-1)
    expect(getNextUniversalSearchResultIndex(-1, 3)).toBe(0)
    expect(getNextUniversalSearchResultIndex(2, 3)).toBe(0)
    expect(getPreviousUniversalSearchResultIndex(-1, 0)).toBe(-1)
    expect(getPreviousUniversalSearchResultIndex(0, 3)).toBe(2)
  })

  it('opens, searches, selects, navigates, and closes with reset state', async () => {
    const onSelectResult = jest.fn()
    const provider = createMockUniversalSearchProvider({
      documents: [{ id: 'one', text: 'hello hello' }],
      onSelectResult,
    })
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.setQuery('hello')
    await flushSearch()

    expect(controller.isOpen).toBe(true)
    expect(controller.status).toBe('ready')
    expect(controller.results).toHaveLength(2)
    expect(controller.currentResultIndex).toBe(0)
    expect(onSelectResult).toHaveBeenCalledWith(expect.objectContaining({ id: 'one-0' }))

    controller.goToNextResult()
    await flushSearch()

    expect(controller.currentResultIndex).toBe(1)
    expect(onSelectResult).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'one-6' }))

    controller.goToNextResult()
    await flushSearch()

    expect(controller.currentResultIndex).toBe(0)

    controller.close()

    expect(controller.isOpen).toBe(false)
    expect(controller.query).toBe('')
    expect(controller.results).toEqual([])
    expect(controller.currentResultIndex).toBe(-1)
  })

  it('debounces query changes before searching', async () => {
    jest.useFakeTimers()
    const search = jest.fn(() => [])
    const provider: UniversalSearchProvider = {
      id: 'debounced',
      capabilities: {
        supportsReplace: false,
        supportsHighlightAll: false,
      },
      search,
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, { searchDebounceMs: 30, contentSearchDebounceMs: 250 })

    controller.open()
    controller.setQuery('h')
    controller.setQuery('he')
    controller.setQuery('hel')

    expect(search).not.toHaveBeenCalled()

    jest.advanceTimersByTime(30)
    await flushSearch()

    expect(search).toHaveBeenCalledTimes(1)
    expect(search).toHaveBeenCalledWith({ query: 'hel', isCaseSensitive: false })

    jest.useRealTimers()
  })

  it('handles provider errors', async () => {
    const provider: UniversalSearchProvider = {
      id: 'failing',
      capabilities: {
        supportsReplace: false,
        supportsHighlightAll: false,
      },
      search: () => {
        throw new Error('Provider failed')
      },
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.setQuery('hello')
    await flushSearch()

    expect(controller.status).toBe('error')
    expect(controller.error).toBe('Provider failed')
    expect(controller.results).toEqual([])
  })

  it('delegates replacement through provider contracts', async () => {
    const provider = createMockUniversalSearchProvider({
      documents: [{ id: 'one', text: 'hello hello' }],
    })
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.setQuery('hello')
    controller.setReplaceQuery('goodbye')
    await flushSearch()

    await controller.replaceCurrentResult()

    expect(provider.getDocuments()[0].text).toBe('goodbye hello')
    expect(controller.results).toHaveLength(1)

    await controller.replaceAllResults()

    expect(provider.getDocuments()[0].text).toBe('goodbye goodbye')
    expect(controller.results).toHaveLength(0)
  })

  it('preserves the current result index after replacing a single match', async () => {
    const provider = createMockUniversalSearchProvider({
      documents: [{ id: 'one', text: 'hello hello hello' }],
    })
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.setQuery('hello')
    controller.setReplaceQuery('bye')
    await flushSearch()

    controller.goToNextResult()
    await flushSearch()
    expect(controller.currentResultIndex).toBe(1)

    await controller.replaceCurrentResult()

    expect(provider.getDocuments()[0].text).toBe('hello bye hello')
    expect(controller.results).toHaveLength(2)
    expect(controller.currentResultIndex).toBe(1)
    expect(controller.currentResult?.id).toBe('one-10')
  })

  it('resetContext clears search state without selecting a stale result', async () => {
    const onSelectResult = jest.fn()
    const provider = createMockUniversalSearchProvider({
      documents: [{ id: 'one', text: 'hello hello' }],
      onSelectResult,
    })
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.setQuery('hello')
    controller.setReplaceQuery('bye')
    controller.toggleReplaceMode()
    await flushSearch()

    expect(controller.isOpen).toBe(true)
    expect(controller.results).toHaveLength(2)
    expect(onSelectResult).toHaveBeenCalledTimes(1)

    controller.resetContext()

    expect(controller.isOpen).toBe(false)
    expect(controller.query).toBe('')
    expect(controller.replaceQuery).toBe('')
    expect(controller.results).toEqual([])
    expect(controller.isReplaceMode).toBe(false)
    expect(onSelectResult).toHaveBeenCalledTimes(1)
  })

  it('does not toggle case sensitivity when search is closed', async () => {
    const search = jest.fn(() => [])
    const provider: UniversalSearchProvider = {
      id: 'case-sensitive',
      capabilities: {
        supportsReplace: false,
        supportsHighlightAll: false,
      },
      search,
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.toggleCaseSensitivity()

    expect(controller.isCaseSensitive).toBe(false)
    expect(search).not.toHaveBeenCalled()
  })

  it('does not enable replace mode when replace is unsupported', () => {
    const provider: UniversalSearchProvider = {
      id: 'no-replace',
      capabilities: {
        supportsReplace: false,
        supportsHighlightAll: true,
      },
      search: jest.fn(() => []),
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.toggleReplaceMode()

    expect(controller.isReplaceMode).toBe(false)
  })

  it('closes replace mode when locked', () => {
    const provider: UniversalSearchProvider = {
      id: 'dynamic-replace',
      capabilities: {
        supportsReplace: true,
        supportsHighlightAll: true,
      },
      search: jest.fn(() => []),
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.toggleReplaceMode()

    expect(controller.isReplaceMode).toBe(true)

    controller.setLocked(true)

    expect(controller.canReplace).toBe(false)
    expect(controller.isReplaceMode).toBe(false)
  })

  it('closes replace mode', () => {
    const provider: UniversalSearchProvider = {
      id: 'dynamic-replace',
      capabilities: {
        supportsReplace: true,
        supportsHighlightAll: true,
      },
      search: jest.fn(() => []),
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, immediateSearchOptions)

    controller.open()
    controller.toggleReplaceMode()

    expect(controller.isReplaceMode).toBe(true)

    controller.closeReplaceMode()

    expect(controller.isReplaceMode).toBe(false)
  })

  it('does not enable replace mode when the note is locked', () => {
    const provider: UniversalSearchProvider = {
      id: 'read-only',
      capabilities: {
        supportsReplace: true,
        supportsHighlightAll: true,
      },
      search: jest.fn(() => []),
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, {
      ...immediateSearchOptions,
    })
    controller.setLocked(true)

    controller.open()
    controller.toggleReplaceMode()

    expect(controller.canReplace).toBe(false)
    expect(controller.isReplaceMode).toBe(false)
  })

  it('does not replace text when locked', async () => {
    const replaceCurrentResult = jest.fn()
    const provider: UniversalSearchProvider = {
      id: 'read-only-replace',
      capabilities: {
        supportsReplace: true,
        supportsHighlightAll: true,
      },
      search: jest.fn(() => [{ id: 'one-0' }]),
      selectResult: jest.fn(),
      clear: jest.fn(),
      replaceCurrentResult,
      replaceAllResults: jest.fn(),
    }
    const controller = new UniversalSearchController(provider, {
      ...immediateSearchOptions,
    })

    controller.open()
    controller.setQuery('hello')
    await flushSearch()
    controller.setReplaceQuery('bye')
    controller.toggleReplaceMode()

    controller.setLocked(true)
    await controller.replaceCurrentResult()
    await controller.replaceAllResults()

    expect(replaceCurrentResult).not.toHaveBeenCalled()
  })
})
