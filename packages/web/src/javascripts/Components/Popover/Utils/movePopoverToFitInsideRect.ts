import { getOverflows } from './Collisions'

export const movePopoverToFitInsideRect = (popoverElement: HTMLElement, rect: DOMRect) => {
  const popoverRect = popoverElement.getBoundingClientRect()
  const x = parseInt(popoverElement.style.getPropertyValue('--translate-x')) || 0
  const y = parseInt(popoverElement.style.getPropertyValue('--translate-y')) || 0
  const overflows = getOverflows(popoverRect, rect)

  if (overflows['top'] > 0) {
    popoverElement.style.setProperty('--translate-y', `${y + overflows['top']}px`)
  }

  if (overflows['bottom'] > 0) {
    popoverElement.style.setProperty('--translate-y', `${y - overflows['bottom']}px`)
  }

  if (overflows['left'] > 0) {
    popoverElement.style.setProperty('--translate-x', `${x + overflows['left']}px`)
  }

  if (overflows['right'] > 0) {
    popoverElement.style.setProperty('--translate-x', `${x - overflows['right']}px`)
  }
}
