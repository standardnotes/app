import { TextRange, UniversalSearchResult } from '../../UniversalSearch/types'

export type PlainSearchHighlightState = {
  isOpen: boolean
  query: string
  results: UniversalSearchResult<TextRange>[]
  currentResult?: UniversalSearchResult<TextRange>
  shouldHighlightAll: boolean
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildPlainSearchHighlightHtml(state: PlainSearchHighlightState, getText: () => string): string | null {
  if (!state.isOpen || !state.query) {
    return null
  }

  const text = getText()
  const matches = state.results
    .map((result) => result.payload)
    .filter((payload): payload is TextRange => payload != undefined)
  const activeMatch = state.currentResult?.payload

  if (!matches.length) {
    return escapeHtml(text)
  }

  const sortedMatches = [...matches].sort((a, b) => a.start - b.start)
  let html = ''
  let lastEnd = 0

  for (const match of sortedMatches) {
    if (match.start < lastEnd) {
      continue
    }

    html += escapeHtml(text.slice(lastEnd, match.start))

    const matchText = escapeHtml(text.slice(match.start, match.end))
    const isActive = activeMatch != undefined && match.start === activeMatch.start && match.end === activeMatch.end
    const shouldShow = state.shouldHighlightAll || isActive

    if (shouldShow) {
      html += `<mark class="${
        isActive ? 'plain-search-highlight-active' : 'plain-search-highlight'
      }">${matchText}</mark>`
    } else {
      html += matchText
    }

    lastEnd = match.end
  }

  html += escapeHtml(text.slice(lastEnd))

  return html
}
