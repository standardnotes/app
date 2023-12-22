import { PopoverCSSProperties } from '../GetPositionedPopoverStyles'
import { getAbsolutePositionedParent } from './getAbsolutePositionedParent'

export const getAdjustedStylesForNonPortalPopover = (
  popoverElement: HTMLElement,
  styles: PopoverCSSProperties,
  parent?: HTMLElement,
) => {
  const absoluteParent = parent || getAbsolutePositionedParent(popoverElement) || popoverElement.parentElement
  const translateXProperty = styles?.['--translate-x']
  const translateYProperty = styles?.['--translate-y']

  const parsedTranslateX = translateXProperty ? parseInt(translateXProperty) : 0
  const parsedTranslateY = translateYProperty ? parseInt(translateYProperty) : 0

  if (!absoluteParent) {
    return styles
  }

  const parentRect = absoluteParent.getBoundingClientRect()

  const adjustedTranslateX = Math.floor(parsedTranslateX - parentRect.left)
  const adjustedTranslateY = Math.floor(parsedTranslateY - parentRect.top)

  return {
    ...styles,
    '--translate-x': `${adjustedTranslateX}px`,
    '--translate-y': `${adjustedTranslateY}px`,
  } as PopoverCSSProperties
}
