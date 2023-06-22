export function getAbsolutePositionedParent(element: HTMLElement | null): HTMLElement | null {
  if (!element) {
    return null
  }

  const parent = element.parentElement

  if (!parent) {
    return null
  }

  const position = window.getComputedStyle(parent).getPropertyValue('position')

  if (position === 'absolute') {
    return parent
  }

  return getAbsolutePositionedParent(parent)
}
