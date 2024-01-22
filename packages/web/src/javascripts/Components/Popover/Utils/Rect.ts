import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { PopoverSide, PopoverAlignment } from '../Types'

export const getPopoverMaxHeight = (
  appRect: DOMRect,
  buttonRect: DOMRect | undefined,
  side: PopoverSide,
  alignment: PopoverAlignment,
  disableMobileFullscreenTakeover?: boolean,
): number | 'none' => {
  const matchesMediumBreakpoint = matchMedia(MediaQueryBreakpoints.md).matches

  if (!matchesMediumBreakpoint && !disableMobileFullscreenTakeover) {
    return 'none'
  }

  const MarginFromAppBorderInPX = 10
  const topSafeAreaInset = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top'),
  )

  let constraint = 0

  if (buttonRect) {
    switch (side) {
      case 'top':
        constraint = Math.abs(appRect.height - buttonRect.top)
        if (topSafeAreaInset > 0) {
          constraint += topSafeAreaInset
        }
        break
      case 'bottom':
        constraint = buttonRect.bottom
        break
      case 'left':
      case 'right':
        switch (alignment) {
          case 'start':
            constraint = buttonRect.top
            break
          case 'end':
            constraint = appRect.height - buttonRect.bottom
            break
        }
        break
    }
  }

  return appRect.height - constraint - MarginFromAppBorderInPX
}

export const getAppRect = (updatedDocumentRect?: DOMRect) => {
  const footerRect = document.querySelector('footer')?.getBoundingClientRect()
  const documentRect = updatedDocumentRect ? updatedDocumentRect : document.documentElement.getBoundingClientRect()

  const appRect = footerRect
    ? DOMRect.fromRect({
        width: documentRect.width,
        height: documentRect.height - footerRect.height,
      })
    : documentRect

  return appRect
}

export const getPositionedPopoverRect = (
  popoverRect: DOMRect,
  buttonRect: DOMRect,
  side: PopoverSide,
  align: PopoverAlignment,
  offset?: number,
): DOMRect => {
  const { width, height } = popoverRect

  const positionPopoverRect = DOMRect.fromRect(popoverRect)

  const finalOffset = offset ? offset : 0

  switch (side) {
    case 'top': {
      positionPopoverRect.y = buttonRect.top - height - finalOffset
      break
    }
    case 'bottom':
      positionPopoverRect.y = buttonRect.bottom + finalOffset
      break
    case 'left':
      positionPopoverRect.x = buttonRect.left - width - finalOffset
      break
    case 'right':
      positionPopoverRect.x = buttonRect.right + finalOffset
      break
  }

  if (side === 'top' || side === 'bottom') {
    switch (align) {
      case 'start':
        positionPopoverRect.x = buttonRect.left
        break
      case 'center':
        positionPopoverRect.x = buttonRect.left - width / 2 + buttonRect.width / 2
        break
      case 'end':
        positionPopoverRect.x = buttonRect.right - width
        break
    }
  } else {
    switch (align) {
      case 'start':
        positionPopoverRect.y = buttonRect.top
        break
      case 'center':
        positionPopoverRect.y = buttonRect.top - height / 2 + buttonRect.height / 2
        break
      case 'end':
        positionPopoverRect.y = buttonRect.bottom - height
        break
    }
  }

  return positionPopoverRect
}
