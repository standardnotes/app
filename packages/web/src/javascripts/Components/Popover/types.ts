import { RefObject, ReactNode } from 'react'

export type PopoverState = 'closed' | 'positioning' | 'open'

export type PopoverElement = HTMLDivElement | HTMLMenuElement

export type PopoverSide = 'top' | 'left' | 'bottom' | 'right'

export type PopoverAlignment = 'start' | 'center' | 'end'

export type PopoverOptions = {
  side: PopoverSide
  align: PopoverAlignment
}

export type RectCollisions = Record<PopoverSide, boolean>

export type CommonPopoverProps = {
  align?: PopoverAlignment
  buttonRef: RefObject<HTMLButtonElement>
  children: ReactNode
  side?: PopoverSide
  overrideZIndex?: string
}
