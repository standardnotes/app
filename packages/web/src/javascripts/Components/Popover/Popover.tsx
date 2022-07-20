import PositionedPopoverContent from './PositionedPopoverContent'
import { PopoverProps } from './Types'

type Props = PopoverProps & {
  open: boolean
}

const Popover = ({
  align,
  anchorElement,
  anchorPoint,
  children,
  className,
  open,
  overrideZIndex,
  side,
  togglePopover,
}: Props) => {
  return open ? (
    <>
      <PositionedPopoverContent
        align={align}
        anchorElement={anchorElement}
        anchorPoint={anchorPoint}
        className={className}
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
