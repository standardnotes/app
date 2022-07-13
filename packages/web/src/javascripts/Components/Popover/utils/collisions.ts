import { PopoverSide, PopoverAlignment, RectCollisions } from '../types'

export const OppositeSide: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export const checkCollisions = (popperRect: DOMRect): RectCollisions => {
  const footerRect = document.querySelector('footer')?.getBoundingClientRect()
  const documentRect = document.documentElement.getBoundingClientRect()
  const appRect = footerRect
    ? DOMRect.fromRect({
        width: documentRect.width,
        height: documentRect.height - footerRect.height,
      })
    : documentRect

  return {
    top: popperRect.top < appRect.top,
    left: popperRect.left < appRect.left,
    bottom: popperRect.bottom > appRect.bottom,
    right: popperRect.right > appRect.right,
  }
}

export const getNonCollidingSide = (
  preferredSide: PopoverSide,
  preferredSideCollisions: RectCollisions,
  oppositeSideCollisions: RectCollisions,
): PopoverSide => {
  return preferredSideCollisions[preferredSide] && !oppositeSideCollisions[preferredSide]
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
