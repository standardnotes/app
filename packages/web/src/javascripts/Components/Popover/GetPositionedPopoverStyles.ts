import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isMobileScreen } from '@/Utils'
import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './Types'
import { OppositeSide, checkCollisions, getNonCollidingAlignment, getOverflows } from './Utils/Collisions'
import { getAppRect, getMaxHeightAdjustedRect, getPopoverMaxHeight, getPositionedPopoverRect } from './Utils/Rect'

const getStylesFromRect = (rect: DOMRect, disableMobileFullscreenTakeover?: boolean): CSSProperties => {
  return {
    willChange: 'transform',
    transform: `translate(${rect.x}px, ${rect.y}px)`,
    height: !isMobileScreen() || disableMobileFullscreenTakeover ? rect.height : '',
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
}: Options): CSSProperties | null => {
  if (!popoverRect || !anchorRect) {
    return null
  }

  const matchesMediumBreakpoint = matchMedia(MediaQueryBreakpoints.md).matches

  if (!matchesMediumBreakpoint && !disableMobileFullscreenTakeover) {
    return null
  }

  const rectForPreferredSide = getPositionedPopoverRect(popoverRect, anchorRect, side, align)
  const preferredSideRectCollisions = checkCollisions(rectForPreferredSide, documentRect)
  const preferredSideOverflows = getOverflows(rectForPreferredSide, documentRect)

  const oppositeSide = OppositeSide[side]
  const rectForOppositeSide = getPositionedPopoverRect(popoverRect, anchorRect, oppositeSide, align)
  const oppositeSideOverflows = getOverflows(rectForOppositeSide, documentRect)

  const sideWithLessOverflows = preferredSideOverflows[side] < oppositeSideOverflows[oppositeSide] ? side : oppositeSide
  const finalAlignment = getNonCollidingAlignment(sideWithLessOverflows, align, preferredSideRectCollisions, {
    popoverRect,
    buttonRect: anchorRect,
    documentRect,
  })
  const finalPositionedRect = getPositionedPopoverRect(popoverRect, anchorRect, sideWithLessOverflows, finalAlignment)

  const maxHeight = getPopoverMaxHeight(
    getAppRect(),
    anchorRect,
    sideWithLessOverflows,
    finalAlignment,
    disableMobileFullscreenTakeover,
  )

  if (maxHeight !== 'none') {
    const maxHeightAdjustedRect = getMaxHeightAdjustedRect(finalPositionedRect, maxHeight)
    return getStylesFromRect(maxHeightAdjustedRect, disableMobileFullscreenTakeover)
  }

  return getStylesFromRect(finalPositionedRect, disableMobileFullscreenTakeover)
}
