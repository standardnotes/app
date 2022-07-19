import PositionedPopoverContent from './PositionedPopoverContent'
import { PopoverProps } from './types'

type Props = PopoverProps & {
  open: boolean
}

const Popover = ({ open, anchorElement, anchorPoint, side, align, children, togglePopover, overrideZIndex }: Props) => {
  return open ? (
    <>
      <PositionedPopoverContent
        align={align}
        anchorElement={anchorElement}
        anchorPoint={anchorPoint}
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
