import { PopoverSide, PopoverAlignment } from '../types'

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
