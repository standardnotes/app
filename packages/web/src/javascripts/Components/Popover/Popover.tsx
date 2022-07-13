import PositionedPopoverContent from './PositionedPopoverContent'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps & {
  open: boolean
}

const Popover = ({ open, buttonRef, side, align, children }: Props) => {
  return open ? (
    <PositionedPopoverContent buttonRef={buttonRef} side={side} align={align}>
      {children}
    </PositionedPopoverContent>
  ) : null
}

export default Popover
