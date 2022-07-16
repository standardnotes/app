import { PopoverSide, PopoverAlignment, RectCollisions } from '../types'

export const OppositeSide: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export const checkCollisions = (popoverRect: DOMRect, containerRect: DOMRect): RectCollisions => {
  const footerRect = document.querySelector('footer')?.getBoundingClientRect()
  const appRect = footerRect
    ? DOMRect.fromRect({
        width: containerRect.width,
        height: containerRect.height - footerRect.height,
      })
    : containerRect

  return {
    top: popoverRect.top < appRect.top,
    left: popoverRect.left < appRect.left,
    bottom: popoverRect.bottom > appRect.bottom,
    right: popoverRect.right > appRect.right,
  }
}

export const getNonCollidingSide = (
  preferredSide: PopoverSide,
  preferredSideCollisions: RectCollisions,
  oppositeSideCollisions: RectCollisions,
): PopoverSide => {
  return !preferredSideCollisions[preferredSide] && !oppositeSideCollisions[preferredSide]
    ? OppositeSide[preferredSide]
    : preferredSide
}

export const getNonCollidingAlignment = (
  finalSide: PopoverSide,
  preferredAlignment: PopoverAlignment,
  collisions: RectCollisions,
): PopoverAlignment => {
  const isHorizontalSide = finalSide === 'top' || finalSide === 'bottom'
  const boundToCheckForStart = isHorizontalSide ? 'right' : 'bottom'
  const boundToCheckForEnd = isHorizontalSide ? 'left' : 'top'

  const prefersAligningAtStart = preferredAlignment === 'start' || preferredAlignment === 'center'
  if (prefersAligningAtStart && collisions[boundToCheckForStart]) {
    return 'end'
  }

  const prefersAligningAtEnd = preferredAlignment === 'end' || preferredAlignment === 'center'
  if (prefersAligningAtEnd && collisions[boundToCheckForEnd]) {
    return 'start'
  }

  return preferredAlignment
}
