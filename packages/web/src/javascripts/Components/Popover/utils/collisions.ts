import { PopoverSide, PopoverAlignment, RectCollisions } from '../types'

export const OppositeSide: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export const checkCollisions = (popperRect: DOMRect): RectCollisions => {
  const documentRect = document.documentElement.getBoundingClientRect()

  return {
    top: popperRect.top < documentRect.top,
    left: popperRect.left < documentRect.left,
    bottom: popperRect.bottom > documentRect.bottom,
    right: popperRect.right > documentRect.right,
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
