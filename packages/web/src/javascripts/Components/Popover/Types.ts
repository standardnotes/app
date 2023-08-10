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

type CommonPopoverProps = {
  align?: PopoverAlignment
  children: ReactNode
  side?: PopoverSide
  overrideZIndex?: string
  className?: string
  containerClassName?: string
  disableClickOutside?: boolean
  maxHeight?: (calculatedMaxHeight: number) => number
  togglePopover?: () => void
  disableMobileFullscreenTakeover?: boolean
  title: string
  portal?: boolean
  offset?: number
  hideOnClickInModal?: boolean
  open: boolean
}

export type PopoverContentProps = CommonPopoverProps & {
  anchorElement?: HTMLElement | null
  anchorPoint?: Point
  childPopovers: Set<string>
  togglePopover?: () => void
  disableMobileFullscreenTakeover?: boolean
  id: string
  setAnimationElement: (element: HTMLElement | null) => void
}

export type PopoverProps =
  | (CommonPopoverProps & PopoverAnchorElementProps)
  | (CommonPopoverProps & PopoverAnchorPointProps)
