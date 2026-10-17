import type { Disposer } from '@/Types/Disposer'
import type { ScrollState } from './types'

export const DEFAULT_SCROLL_BOTTOM_THRESHOLD = 8

export function isScrolledToBottom(element: HTMLElement, threshold = DEFAULT_SCROLL_BOTTOM_THRESHOLD): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element
  return scrollTop + clientHeight >= scrollHeight - threshold
}

/** True when content is taller than the visible area (vertical scrolling is possible). */
export function hasVerticalOverflow(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight
}

export function observeElementScrollState(
  element: HTMLElement,
  observeContentChange: (callback: () => void) => Disposer,
  callback: (state: ScrollState) => void,
): Disposer {
  const refresh = () => {
    callback({ canScroll: hasVerticalOverflow(element), isAtBottom: isScrolledToBottom(element) })
  }
  refresh()

  element.addEventListener('scroll', refresh, { passive: true })
  const resizeObserver = new ResizeObserver(refresh)
  resizeObserver.observe(element)
  const disposeContentChangeObserver = observeContentChange(refresh)

  return () => {
    element.removeEventListener('scroll', refresh)
    resizeObserver.disconnect()
    disposeContentChangeObserver()
  }
}
