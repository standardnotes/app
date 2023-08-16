import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isMobileScreen } from '@/Utils'
import { CSSProperties } from 'react'
import { PopoverAlignment, PopoverSide } from './Types'
import { OppositeSide, checkCollisions, getNonCollidingAlignment } from './Utils/Collisions'
import { getAppRect, getPopoverMaxHeight, getPositionedPopoverRect } from './Utils/Rect'

const percentOf = (percent: number, value: number) => (percent / 100) * value

export type PopoverCSSProperties = CSSProperties & {
  '--translate-x': string
  '--translate-y': string
  '--transform-origin': string
  '--offset': string
}

const getTransformOrigin = (side: PopoverSide, align: PopoverAlignment) => {
  switch (side) {
    case 'top':
      switch (align) {
        case 'start':
          return 'bottom left'
        case 'center':
          return 'bottom center'
        case 'end':
          return 'bottom right'
      }
      break
    case 'bottom':
      switch (align) {
        case 'start':
          return 'top left'
        case 'center':
          return 'top center'
        case 'end':
          return 'top right'
      }
      break
    case 'left':
      switch (align) {
        case 'start':
          return 'top right'
        case 'center':
          return 'top center'
        case 'end':
          return 'bottom right'
      }
      break
    case 'right':
      switch (align) {
        case 'start':
          return 'top left'
        case 'center':
          return 'top center'
        case 'end':
          return 'bottom left'
      }
  }
}

const getStylesFromRect = (options: {
  rect: DOMRect
  side: PopoverSide
  align: PopoverAlignment
  disableMobileFullscreenTakeover?: boolean
  disableApplyingMobileWidth?: boolean
  maxHeight?: number | 'none'
  offset?: number
}): PopoverCSSProperties => {
  const {
    rect,
    disableMobileFullscreenTakeover = false,
    disableApplyingMobileWidth = false,
    maxHeight = 'none',
  } = options

  const canApplyMaxHeight = maxHeight !== 'none' && (!isMobileScreen() || disableMobileFullscreenTakeover)
  const shouldApplyMobileWidth = isMobileScreen() && disableMobileFullscreenTakeover && !disableApplyingMobileWidth
  const marginForMobile = percentOf(10, window.innerWidth)

  return {
    willChange: 'transform',
    '--translate-x': `${shouldApplyMobileWidth ? marginForMobile / 2 : Math.floor(rect.x)}px`,
    '--translate-y': `${Math.floor(rect.y)}px`,
    '--offset': `${options.offset}px`,
    transform: 'translate3d(var(--translate-x), var(--translate-y), 0)',
    '--transform-origin': getTransformOrigin(options.side, options.align),
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
  disableApplyingMobileWidth?: boolean
  maxHeightFunction?: (calculatedMaxHeight: number) => number | 'none'
  offset?: number
}

export const getPositionedPopoverStyles = ({
  align,
  anchorRect,
  documentRect,
  popoverRect,
  side,
  disableMobileFullscreenTakeover,
  disableApplyingMobileWidth,
  maxHeightFunction,
  offset,
}: Options): PopoverCSSProperties | null => {
  if (!popoverRect || !anchorRect) {
    return null
  }

  const matchesMediumBreakpoint = matchMedia(MediaQueryBreakpoints.md).matches

  if (!matchesMediumBreakpoint && !disableMobileFullscreenTakeover) {
    return null
  }

  const rectForPreferredSide = getPositionedPopoverRect(popoverRect, anchorRect, side, align)
  const preferredSideRectCollisions = checkCollisions(rectForPreferredSide, documentRect)

  const oppositeSide = OppositeSide[side]

  const sideWithLessOverflows = preferredSideRectCollisions[side] ? oppositeSide : side
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

  return getStylesFromRect({
    rect: finalPositionedRect,
    side: sideWithLessOverflows,
    align: finalAlignment,
    disableMobileFullscreenTakeover,
    disableApplyingMobileWidth,
    maxHeight,
    offset,
  })
}
