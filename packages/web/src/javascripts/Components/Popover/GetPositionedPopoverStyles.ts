import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isMobileScreen } from '@/Utils'
import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './Types'
import { OppositeSide, checkCollisions, getNonCollidingAlignment, getOverflows } from './Utils/Collisions'
import { getAppRect, getPopoverMaxHeight, getPositionedPopoverRect } from './Utils/Rect'

const percentOf = (percent: number, value: number) => (percent / 100) * value

const getStylesFromRect = (
  rect: DOMRect,
  options: {
    disableMobileFullscreenTakeover?: boolean
    maxHeight?: number | 'none'
  },
): CSSProperties => {
  const { disableMobileFullscreenTakeover = false, maxHeight = 'none' } = options

  const canApplyMaxHeight = maxHeight !== 'none' && (!isMobileScreen() || disableMobileFullscreenTakeover)
  const shouldApplyMobileWidth = isMobileScreen() && disableMobileFullscreenTakeover
  const marginForMobile = percentOf(10, window.innerWidth)

  return {
    willChange: 'transform',
    transform: `translate(${shouldApplyMobileWidth ? marginForMobile / 2 : rect.x}px, ${rect.y}px)`,
    visibility: 'visible',
    ...(canApplyMaxHeight && {
      maxHeight: `${maxHeight}px`,
    }),
    ...(shouldApplyMobileWidth && {
      width: `${window.innerWidth - marginForMobile}px`,
    }),
  }
}

type Options = {
  align: PopoverAlignment
  anchorRect?: DOMRect
  documentRect: DOMRect
  popoverRect?: DOMRect
  side: PopoverSide
  disableMobileFullscreenTakeover?: boolean
  maxHeightFunction?: (calculatedMaxHeight: number) => number
  offset?: number
}

export const getPositionedPopoverStyles = ({
  align,
  anchorRect,
  documentRect,
  popoverRect,
  side,
  disableMobileFullscreenTakeover,
  maxHeightFunction,
  offset,
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
  const finalAlignment = getNonCollidingAlignment({
    finalSide: sideWithLessOverflows,
    preferredAlignment: align,
    collisions: preferredSideRectCollisions,
    popoverRect,
    buttonRect: anchorRect,
    documentRect,
  })
  const finalPositionedRect = getPositionedPopoverRect(
    popoverRect,
    anchorRect,
    sideWithLessOverflows,
    finalAlignment,
    offset,
  )

  let maxHeight = getPopoverMaxHeight(
    getAppRect(),
    anchorRect,
    sideWithLessOverflows,
    finalAlignment,
    disableMobileFullscreenTakeover,
  )

  if (maxHeightFunction && typeof maxHeight === 'number') {
    maxHeight = maxHeightFunction(maxHeight)
  }

  return getStylesFromRect(finalPositionedRect, { disableMobileFullscreenTakeover, maxHeight })
}
