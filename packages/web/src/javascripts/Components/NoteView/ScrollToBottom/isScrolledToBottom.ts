export const DEFAULT_SCROLL_BOTTOM_THRESHOLD = 8

export function isScrolledToBottom(element: HTMLElement, threshold = DEFAULT_SCROLL_BOTTOM_THRESHOLD): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element
  return scrollTop + clientHeight >= scrollHeight - threshold
}

/** True when content is taller than the visible area (vertical scrolling is possible). */
export function hasVerticalOverflow(element: HTMLElement): boolean {
  return element.scrollHeight > element.clientHeight
}
