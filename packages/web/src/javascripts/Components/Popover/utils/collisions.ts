import { PopoverSide, PopoverAlignment, RectCollisions } from '../types'
import { getAppRect, getPositionedPopoverRect } from './rect'

export const OppositeSide: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export const checkCollisions = (popoverRect: DOMRect, containerRect: DOMRect): RectCollisions => {
  const appRect = getAppRect(containerRect)

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
  const oppositeSide = OppositeSide[preferredSide]

  return preferredSideCollisions[preferredSide] && !oppositeSideCollisions[oppositeSide] ? oppositeSide : preferredSide
}

export const getNonCollidingAlignment = (
  finalSide: PopoverSide,
  preferredAlignment: PopoverAlignment,
  collisions: RectCollisions,
  {
    popoverRect,
    buttonRect,
    documentRect,
  }: {
    popoverRect: DOMRect
    buttonRect: DOMRect
    documentRect: DOMRect
  },
): PopoverAlignment => {
  const isHorizontalSide = finalSide === 'top' || finalSide === 'bottom'
  const boundToCheckForStart = isHorizontalSide ? 'right' : 'bottom'
  const boundToCheckForEnd = isHorizontalSide ? 'left' : 'top'

  const prefersAligningAtStart = preferredAlignment === 'start'
  if (prefersAligningAtStart && collisions[boundToCheckForStart]) {
    const oppositeAlignmentCollisions = checkCollisions(
      getPositionedPopoverRect(popoverRect, buttonRect, finalSide, 'end'),
      documentRect,
    )
    if (!oppositeAlignmentCollisions[boundToCheckForEnd]) {
      return 'end'
    }
  }

  const prefersAligningAtEnd = preferredAlignment === 'end'
  if (prefersAligningAtEnd && collisions[boundToCheckForEnd]) {
    const oppositeAlignmentCollisions = checkCollisions(
      getPositionedPopoverRect(popoverRect, buttonRect, finalSide, 'start'),
      documentRect,
    )
    if (!oppositeAlignmentCollisions[boundToCheckForStart]) {
      return 'start'
    }
  }

  const prefersAligningAtCenter = preferredAlignment === 'center'
  if (prefersAligningAtCenter) {
    if (collisions[boundToCheckForStart]) {
      return 'end'
    }
    if (collisions[boundToCheckForEnd]) {
      return 'start'
    }
  }

  return preferredAlignment
}
