import { PopoverSide } from '../Types'

export const isVerticalSide = (side: PopoverSide): side is 'top' | 'bottom' => side === 'top' || side === 'bottom'
