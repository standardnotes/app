import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './types'
import { OppositeSide, checkCollisions, getNonCollidingSide, getNonCollidingAlignment } from './utils/collisions'
import { getPositionedPopoverRect } from './utils/rect'

const getStylesFromRect = (rect: DOMRect): CSSProperties => {
  return {
    willChange: 'transform',
    transform: `translate(${rect.x}px, ${rect.y}px)`,
  }
}

type Options = {
  align: PopoverAlignment
  buttonRect?: DOMRect
  documentRect: DOMRect
  popoverRect?: DOMRect
  side: PopoverSide
}

export const getPositionedPopoverStyles = ({
  align,
  buttonRect,
  documentRect,
  popoverRect,
  side,
}: Options): [CSSProperties | null, PopoverSide, PopoverAlignment] => {
  if (!popoverRect || !buttonRect) {
    return [null, side, align]
  }

  const matchesMediumBreakpoint = matchMedia('(min-width: 768px)').matches

  if (!matchesMediumBreakpoint) {
    return [null, side, align]
  }

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
