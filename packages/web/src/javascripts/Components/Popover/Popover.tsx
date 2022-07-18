import Icon from '../Icon/Icon'
import Portal from '../Portal/Portal'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import PositionedPopoverContent from './PositionedPopoverContent'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps & {
  open: boolean
  togglePopover: () => void
}

const Popover = ({ open, buttonRef, side, align, children, togglePopover, overrideZIndex }: Props) => {
  return open ? (
    <>
      <PositionedPopoverContent buttonRef={buttonRef} side={side} align={align} overrideZIndex={overrideZIndex}>
        {children}
      </PositionedPopoverContent>
      <Portal>
        <div className="absolute top-0 left-0 z-modal flex h-full w-full flex-col bg-default py-2 md:hidden">
          <div className="flex items-center justify-end px-3">
            <button className="rounded-full border border-border p-1" onClick={togglePopover}>
              <Icon type="close" className="h-4 w-4" />
            </button>
          </div>
          <HorizontalSeparator classes="my-2" />
          {children}
        </div>
      </Portal>
    </>
  ) : null
}

export default Popover
