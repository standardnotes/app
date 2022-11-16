import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './Types'
import { OppositeSide, checkCollisions, getNonCollidingSide, getNonCollidingAlignment } from './Utils/Collisions'
import { getPositionedPopoverRect } from './Utils/Rect'

const getStylesFromRect = (rect: DOMRect, disableMobileFullscreenTakeover?: boolean): CSSProperties => {
  return {
    willChange: 'transform',
    transform: `translate(${rect.x}px, ${rect.y}px)`,
    ...(disableMobileFullscreenTakeover
      ? {
          maxWidth: `${window.innerWidth - rect.x * 2}px`,
        }
      : {}),
  }
}

type Options = {
  align: PopoverAlignment
  anchorRect?: DOMRect
  documentRect: DOMRect
  popoverRect?: DOMRect
  side: PopoverSide
  disableMobileFullscreenTakeover?: boolean
}

export const getPositionedPopoverStyles = ({
  align,
  anchorRect,
  documentRect,
  popoverRect,
  side,
  disableMobileFullscreenTakeover,
}: Options): [CSSProperties | null, PopoverSide, PopoverAlignment] => {
  if (!popoverRect || !anchorRect) {
    return [null, side, align]
  }

  const matchesMediumBreakpoint = matchMedia(MediaQueryBreakpoints.md).matches

  if (!matchesMediumBreakpoint && !disableMobileFullscreenTakeover) {
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

  return [getStylesFromRect(finalPositionedRect, disableMobileFullscreenTakeover), finalSide, finalAlignment]
}
