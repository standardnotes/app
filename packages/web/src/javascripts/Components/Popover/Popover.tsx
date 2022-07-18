import PositionedPopoverContent from './PositionedPopoverContent'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps & {
  open: boolean
}

const Popover = ({ open, buttonRef, side, align, children, togglePopover, overrideZIndex }: Props) => {
  return open ? (
    <>
      <PositionedPopoverContent
        align={align}
        buttonRef={buttonRef}
        overrideZIndex={overrideZIndex}
        side={side}
        togglePopover={togglePopover}
      >
        {children}
      </PositionedPopoverContent>
    </>
  ) : null
}

export default Popover
