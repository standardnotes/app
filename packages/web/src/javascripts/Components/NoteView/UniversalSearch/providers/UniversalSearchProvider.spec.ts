/**
 * @jest-environment jsdom
 */

import { NoOpUniversalSearchProvider } from './NoOpUniversalSearchProvider'
import { createMockUniversalSearchProvider } from './createMockUniversalSearchProvider'

describe('UniversalSearchProvider', () => {
  it('returns no results for unsupported editors', async () => {
    expect(await NoOpUniversalSearchProvider.search({ query: 'hello', isCaseSensitive: false })).toEqual([])
    expect(NoOpUniversalSearchProvider.capabilities.supportsSearch).toBe(false)
    expect(NoOpUniversalSearchProvider.capabilities.supportsReplace).toBe(false)
  })

  it('searches documents with a mock provider', async () => {
    const provider = createMockUniversalSearchProvider({
      documents: [
        { id: 'one', text: 'Hello world' },
        { id: 'two', text: 'hello again' },
      ],
    })

    const results = await provider.search({ query: 'hello', isCaseSensitive: false })

    expect(results.map(({ id }) => id)).toEqual(['one-0', 'two-0'])
  })

  it('honors case sensitivity in the mock provider', async () => {
    const provider = createMockUniversalSearchProvider({
      documents: [{ id: 'one', text: 'Hello hello' }],
    })

    expect(await provider.search({ query: 'hello', isCaseSensitive: true })).toHaveLength(1)
    expect(await provider.search({ query: 'hello', isCaseSensitive: false })).toHaveLength(2)
  })

  it('supports current and all replacements in the mock provider', async () => {
    const provider = createMockUniversalSearchProvider({
      documents: [{ id: 'one', text: 'hello hello' }],
    })
    const [firstResult] = await provider.search({ query: 'hello', isCaseSensitive: false })

    await provider.replaceCurrentResult?.(firstResult, {
      query: 'hello',
      isCaseSensitive: false,
      replaceQuery: 'goodbye',
    })

    expect(provider.getDocuments()[0].text).toBe('goodbye hello')

    const results = await provider.search({ query: 'hello', isCaseSensitive: false })
    await provider.replaceAllResults?.(results, {
      query: 'hello',
      isCaseSensitive: false,
      replaceQuery: 'bye',
    })

    expect(provider.getDocuments()[0].text).toBe('goodbye bye')
  })
})
