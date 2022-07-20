import { PopoverSide, PopoverAlignment, RectCollisions } from '../Types'
import { getAppRect, getPositionedPopoverRect } from './Rect'

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

const OppositeAlignment: Record<Exclude<PopoverAlignment, 'center'>, PopoverAlignment> = {
  start: 'end',
  end: 'start',
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
  const prefersAligningAtCenter = preferredAlignment === 'center'
  const prefersAligningAtEnd = preferredAlignment === 'end'

  if (prefersAligningAtCenter) {
    if (collisions[boundToCheckForStart]) {
      return 'end'
    }
    if (collisions[boundToCheckForEnd]) {
      return 'start'
    }
  } else {
    const oppositeAlignmentCollisions = checkCollisions(
      getPositionedPopoverRect(popoverRect, buttonRect, finalSide, OppositeAlignment[preferredAlignment]),
      documentRect,
    )

    if (
      prefersAligningAtStart &&
      collisions[boundToCheckForStart] &&
      !oppositeAlignmentCollisions[boundToCheckForEnd]
    ) {
      return 'end'
    }

    if (prefersAligningAtEnd && collisions[boundToCheckForEnd] && !oppositeAlignmentCollisions[boundToCheckForStart]) {
      return 'start'
    }
  }

  return preferredAlignment
}
