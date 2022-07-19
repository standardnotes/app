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
  anchorRect?: DOMRect
  documentRect: DOMRect
  popoverRect?: DOMRect
  side: PopoverSide
}

export const getPositionedPopoverStyles = ({
  align,
  anchorRect,
  documentRect,
  popoverRect,
  side,
}: Options): [CSSProperties | null, PopoverSide, PopoverAlignment] => {
  if (!popoverRect || !anchorRect) {
    return [null, side, align]
  }

  const matchesMediumBreakpoint = matchMedia('(min-width: 768px)').matches

  if (!matchesMediumBreakpoint) {
    return [null, side, align]
  }

  const rectForPreferredSide = getPositionedPopoverRect(popoverRect, anchorRect, side, align)
  const preferredSideRectCollisions = checkCollisions(rectForPreferredSide, documentRect)

  const oppositeSide = OppositeSide[side]
  const rectForOppositeSide = getPositionedPopoverRect(popoverRect, anchorRect, oppositeSide, align)
  const oppositeSideRectCollisions = checkCollisions(rectForOppositeSide, documentRect)

  const finalSide = getNonCollidingSide(side, preferredSideRectCollisions, oppositeSideRectCollisions)
  const finalAlignment = getNonCollidingAlignment(finalSide, align, preferredSideRectCollisions, {
    popoverRect,
    buttonRect: anchorRect,
    documentRect,
  })
  const finalPositionedRect = getPositionedPopoverRect(popoverRect, anchorRect, finalSide, finalAlignment)

  return [Object.assign({}, getStylesFromRect(finalPositionedRect)), finalSide, finalAlignment]
}
