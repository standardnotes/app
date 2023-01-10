import { ReactNode } from 'react'

export type PopoverState = 'closed' | 'positioning' | 'open'

export type PopoverElement = HTMLDivElement | HTMLMenuElement

export type PopoverSide = 'top' | 'left' | 'bottom' | 'right'

export type PopoverAlignment = 'start' | 'center' | 'end'

export type PopoverOptions = {
  side: PopoverSide
  align: PopoverAlignment
}

export type RectCollisions = Record<PopoverSide, boolean>

type Point = {
  x: number
  y: number
}

type PopoverAnchorElementProps = {
  anchorElement: HTMLElement | null
  anchorPoint?: never
}

type PopoverAnchorPointProps = {
  anchorPoint: Point
  anchorElement?: never
}

type PopoverMutuallyExclusiveProps =
  | {
      togglePopover: () => void
      disableMobileFullscreenTakeover?: never
    }
  | {
      togglePopover?: never
      disableMobileFullscreenTakeover: boolean
    }

type CommonPopoverProps = {
  align?: PopoverAlignment
  children: ReactNode
  side?: PopoverSide
  overrideZIndex?: string
  className?: string
  disableClickOutside?: boolean
  maxHeight?: (calculatedMaxHeight: number) => number
  title: string
}

export type PopoverContentProps = CommonPopoverProps & {
  anchorElement?: HTMLElement | null
  anchorPoint?: Point
  childPopovers: Set<string>
  togglePopover?: () => void
  disableMobileFullscreenTakeover?: boolean
  id: string
}

export type PopoverProps =
  | (CommonPopoverProps & PopoverMutuallyExclusiveProps & PopoverAnchorElementProps)
  | (CommonPopoverProps & PopoverMutuallyExclusiveProps & PopoverAnchorPointProps)
