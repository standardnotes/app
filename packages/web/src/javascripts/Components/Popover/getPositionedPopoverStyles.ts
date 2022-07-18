import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './types'
import { OppositeSide, checkCollisions, getNonCollidingSide, getNonCollidingAlignment } from './utils/collisions'
import { getPositionedPopoverRect } from './utils/rect'

const getStylesFromRect = (rect: DOMRect): CSSProperties => {
  return {
    top: 0,
    left: 0,
    willChange: 'transform',
    transform: `translate(${rect.x}px, ${rect.y}px)`,
  }
}

type Options = {
  align: PopoverAlignment
  buttonElement: HTMLButtonElement | null
  documentRect: DOMRect
  popoverRect?: DOMRect
  side: PopoverSide
}

export const getPositionedPopoverStyles = ({
  align,
  buttonElement,
  documentRect,
  popoverRect,
  side,
}: Options): [CSSProperties | null, PopoverSide, PopoverAlignment] => {
  if (!popoverRect || !buttonElement) {
    return [null, side, align]
  }

  const buttonRect = buttonElement.getBoundingClientRect()

  const rectForPreferredSide = getPositionedPopoverRect(popoverRect, buttonRect, side, align)
  const preferredSideRectCollisions = checkCollisions(rectForPreferredSide, documentRect)

  const oppositeSide = OppositeSide[side]
  const rectForOppositeSide = getPositionedPopoverRect(popoverRect, buttonRect, oppositeSide, align)
  const oppositeSideRectCollisions = checkCollisions(rectForOppositeSide, documentRect)

  const finalSide = getNonCollidingSide(side, preferredSideRectCollisions, oppositeSideRectCollisions)
  const finalAlignment = getNonCollidingAlignment(finalSide, align, preferredSideRectCollisions, {
    popoverRect,
    buttonRect,
    documentRect,
  })
  const finalPositionedRect = getPositionedPopoverRect(popoverRect, buttonRect, finalSide, finalAlignment)

  return [Object.assign({}, getStylesFromRect(finalPositionedRect)), finalSide, finalAlignment]
}
