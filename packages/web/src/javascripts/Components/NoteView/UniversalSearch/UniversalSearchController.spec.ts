import { createMockUniversalSearchProvider } from './providers/createMockUniversalSearchProvider'
import {
  getNextUniversalSearchResultIndex,
  getPreviousUniversalSearchResultIndex,
  UniversalSearchController,
} from './UniversalSearchController'
import { UniversalSearchProvider } from './types'
import { NoOpUniversalSearchProvider } from './providers/NoOpUniversalSearchProvider'

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
    const controller = new UniversalSearchController(provider)

    controller.open()
    controller.setQuery('hello')
    await flushSearch()

    expect(controller.isOpen).toBe(true)
    expect(controller.status).toBe('ready')
    expect(controller.results).toHaveLength(2)
    expect(controller.currentResultIndex).toBe(0)

    controller.goToNextResult()

    expect(controller.currentResultIndex).toBe(1)
    expect(onSelectResult).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'one-6' }))

    controller.goToNextResult()

    expect(controller.currentResultIndex).toBe(0)

    controller.close()

    expect(controller.isOpen).toBe(false)
    expect(controller.query).toBe('')
    expect(controller.results).toEqual([])
    expect(controller.currentResultIndex).toBe(-1)
  })

  it('handles provider errors', async () => {
    const provider: UniversalSearchProvider = {
      id: 'failing',
      capabilities: {
        supportsSearch: true,
        supportsReplace: false,
        supportsHighlightAll: false,
      },
      search: () => {
        throw new Error('Provider failed')
      },
      selectResult: jest.fn(),
      clear: jest.fn(),
    }
    const controller = new UniversalSearchController(provider)

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
    const controller = new UniversalSearchController(provider)

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

  it('keeps unsupported providers stable and predictable', async () => {
    const controller = new UniversalSearchController(NoOpUniversalSearchProvider)

    controller.open()
    controller.setQuery('hello')
    controller.goToNextResult()
    await flushSearch()

    expect(controller.results).toEqual([])
    expect(controller.currentResultIndex).toBe(-1)
    await expect(controller.replaceCurrentResult()).resolves.toBeUndefined()
  })

  it('does not open when access is disabled', () => {
    const controller = new UniversalSearchController(NoOpUniversalSearchProvider, { isEnabled: false })

    controller.open()

    expect(controller.isOpen).toBe(false)
  })
})
