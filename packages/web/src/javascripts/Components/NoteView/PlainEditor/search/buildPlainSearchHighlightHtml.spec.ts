import { buildPlainSearchHighlightHtml } from './buildPlainSearchHighlightHtml'

describe('buildPlainSearchHighlightHtml', () => {
  it('returns null when search is closed', () => {
    expect(
      buildPlainSearchHighlightHtml(
        {
          isOpen: false,
          query: 'hello',
          results: [],
          shouldHighlightAll: true,
        },
        () => 'hello world',
      ),
    ).toBeNull()
  })

  it('escapes html in note text', () => {
    const html = buildPlainSearchHighlightHtml(
      {
        isOpen: true,
        query: 'x',
        results: [],
        shouldHighlightAll: true,
      },
      () => '<script>',
    )

    expect(html).toBe('&lt;script&gt;')
  })

  it('highlights all matches when enabled', () => {
    const html = buildPlainSearchHighlightHtml(
      {
        isOpen: true,
        query: 'hello',
        results: [
          { id: '1', payload: { start: 0, end: 5 } },
          { id: '2', payload: { start: 6, end: 11 } },
        ],
        currentResult: { id: '1', payload: { start: 0, end: 5 } },
        shouldHighlightAll: true,
      },
      () => 'hello hello',
    )

    expect(html).toContain('<mark class="plain-search-highlight-active">hello</mark>')
    expect(html).toContain('<mark class="plain-search-highlight">hello</mark>')
  })

  it('highlights only the active match when highlight all is disabled', () => {
    const html = buildPlainSearchHighlightHtml(
      {
        isOpen: true,
        query: 'hello',
        results: [
          { id: '1', payload: { start: 0, end: 5 } },
          { id: '2', payload: { start: 6, end: 11 } },
        ],
        currentResult: { id: '2', payload: { start: 6, end: 11 } },
        shouldHighlightAll: false,
      },
      () => 'hello hello',
    )

    expect(html).toBe('hello <mark class="plain-search-highlight-active">hello</mark>')
  })
})
