import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './types'
import { OppositeSide, checkCollisions, getNonCollidingSide, getNonCollidingAlignment } from './utils/collisions'
import { getPositionedPopoverRect } from './utils/getPositionedRect'

const getStylesFromRect = (rect: DOMRect): CSSProperties => {
  return {
    top: 0,
    left: 0,
    willChange: 'transform',
    transform: `translate(${rect.x}px, ${rect.y}px)`,
  }
}

type Options = {
  button: HTMLButtonElement | null
  popoverRect?: DOMRect
  side?: PopoverSide
  align?: PopoverAlignment
}

export const getPositionedPopoverStyles = ({
  popoverRect,
  button,
  side = 'bottom',
  align = 'end',
}: Options): CSSProperties | null => {
  if (!popoverRect || !button) {
    return null
  }

  const buttonRect = button.getBoundingClientRect()

  const rectForPreferredSide = getPositionedPopoverRect(popoverRect, buttonRect, side, align)
  const preferredSideRectCollisions = checkCollisions(rectForPreferredSide)

  const oppositeSide = OppositeSide[side]
  const rectForOppositeSide = getPositionedPopoverRect(popoverRect, buttonRect, oppositeSide, align)
  const oppositeSideRectCollisions = checkCollisions(rectForOppositeSide)

  const finalSide = getNonCollidingSide(side, preferredSideRectCollisions, oppositeSideRectCollisions)
  const finalAlignment = getNonCollidingAlignment(finalSide, align, preferredSideRectCollisions)
  const finalPositionedRect = getPositionedPopoverRect(popoverRect, buttonRect, finalSide, finalAlignment)

  return getStylesFromRect(finalPositionedRect)
}
