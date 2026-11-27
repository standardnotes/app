import type { Disposer } from '@/Types/Disposer'
import type { ComponentScrollState } from '@standardnotes/snjs'
import type { ScrollableEditor } from './types'

const ScrollBottomThreshold = 8

export function isScrolledToBottom(element: HTMLElement): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element
  return scrollTop + clientHeight >= scrollHeight - ScrollBottomThreshold
}

/** True when content is taller than the visible area (vertical scrolling is possible). */
function hasVerticalOverflow(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight
}

export function observeElementScrollState(
  element: HTMLElement,
  observeContentChange: (callback: () => void) => Disposer,
  callback: (state: ComponentScrollState) => void,
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

/** Read-only editors can't take focus, which leaves it on the body */
export function isFocusInEditor(editor: Pick<ScrollableEditor, 'getKeyboardTarget'>): boolean {
  return document.activeElement === editor.getKeyboardTarget() || document.activeElement === document.body
}
