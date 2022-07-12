import PopoverContent from './PopoverContent'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps & {
  open: boolean
}

const Popover = ({ open, buttonRef, side, align, children }: Props) => {
  return open ? (
    <PopoverContent buttonRef={buttonRef} side={side} align={align}>
      {children}
    </PopoverContent>
  ) : null
}

export default Popover
