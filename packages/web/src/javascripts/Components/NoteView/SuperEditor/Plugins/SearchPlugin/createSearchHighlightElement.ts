import { SuperSearchResult } from './Types'

export const createSearchHighlightElement = (
  result: SuperSearchResult,
  rootElement: Element,
  containerElement: Element,
) => {
  const rootElementRect = rootElement.getBoundingClientRect()

  const range = document.createRange()
  range.setStart(result.node, result.startIndex)
  range.setEnd(result.node, result.endIndex)

  const rects = range.getClientRects()

  Array.from(rects).forEach((rect, index) => {
    const id = `search-${result.startIndex}-${result.endIndex}-${index}`

    const existingHighlightElement = document.getElementById(id)

    if (existingHighlightElement) {
      return
    }

    const highlightElement = document.createElement('div')
    highlightElement.style.position = 'absolute'
    highlightElement.style.zIndex = '1000'
    highlightElement.style.transform = `translate(${rect.left - rootElementRect.left}px, ${
      rect.top - rootElementRect.top + rootElement.scrollTop
    }px)`
    highlightElement.style.width = `${rect.width}px`
    highlightElement.style.height = `${rect.height}px`
    highlightElement.style.backgroundColor = 'var(--sn-stylekit-info-color)'
    highlightElement.style.opacity = '0.5'
    highlightElement.className = 'search-highlight'
    highlightElement.id = id

    containerElement.appendChild(highlightElement)
  })
}
