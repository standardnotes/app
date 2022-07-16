import { PopoverSide, PopoverAlignment } from '../types'

export const getPopoverMaxHeight = (
  appRect: DOMRect,
  buttonRect: DOMRect | undefined,
  side: PopoverSide,
  alignment: PopoverAlignment,
) => {
  const MarginFromAppBorderInPX = 10

  let constraint = 0

  if (buttonRect) {
    if (side === 'bottom') {
      constraint = buttonRect.bottom
    }
    if (side === 'top') {
      constraint = appRect.height - buttonRect.top
    }
    if (side === 'left') {
      switch (alignment) {
        case "start":
          break
        case "center":
          break
        case "end":
          break
      }
    }
  }

  return appRect.height - constraint - MarginFromAppBorderInPX
}

export const getMaxHeightAdjustedRect = (rect: DOMRect, maxHeight: number) => {
  return DOMRect.fromRect({
    width: rect.width,
    height: rect.height < maxHeight ? rect.height : maxHeight,
    x: rect.x,
    y: rect.y,
  })
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
): DOMRect => {
  const { width, height } = popoverRect

  const positionPopoverRect = DOMRect.fromRect(popoverRect)

  switch (side) {
    case 'top': {
      positionPopoverRect.y = buttonRect.top - height
      break
    }
    case 'bottom':
      positionPopoverRect.y = buttonRect.bottom
      break
    case 'left':
      positionPopoverRect.x = buttonRect.left - width
      break
    case 'right':
      positionPopoverRect.x = buttonRect.right
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
