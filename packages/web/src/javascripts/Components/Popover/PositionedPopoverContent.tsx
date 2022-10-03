import { useDocumentRect } from '@/Hooks/useDocumentRect'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useState } from 'react'
import Icon from '../Icon/Icon'
import Portal from '../Portal/Portal'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { getPositionedPopoverStyles } from './GetPositionedPopoverStyles'
import { PopoverContentProps } from './Types'
import { getPopoverMaxHeight, getAppRect } from './Utils/Rect'
import { usePopoverCloseOnClickOutside } from './Utils/usePopoverCloseOnClickOutside'
import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

const PositionedPopoverContent = ({
  align = 'end',
  anchorElement,
  anchorPoint,
  children,
  childPopovers,
  className,
  id,
  overrideZIndex,
  side = 'bottom',
  togglePopover,
}: PopoverContentProps) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)
  const anchorElementRect = useAutoElementRect(anchorElement, {
    updateOnWindowResize: true,
  })
  const anchorPointRect = DOMRect.fromRect({
    x: anchorPoint?.x,
    y: anchorPoint?.y,
  })
  const anchorRect = anchorPoint ? anchorPointRect : anchorElementRect
  const documentRect = useDocumentRect()
  const isDesktopScreen = useMediaQuery(MediaQueryBreakpoints.md)

  const [styles, positionedSide, positionedAlignment] = getPositionedPopoverStyles({
    align,
    anchorRect,
    documentRect,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
  })

  usePopoverCloseOnClickOutside({
    popoverElement,
    anchorElement,
    togglePopover,
    childPopovers,
  })

  useDisableBodyScrollOnMobile()

  return (
    <Portal>
      <div
        className={classNames(
          'absolute top-0 left-0 flex h-full w-full min-w-80 cursor-auto flex-col overflow-y-auto rounded bg-default shadow-main md:h-auto md:max-w-xs',
          overrideZIndex ? overrideZIndex : 'z-dropdown-menu',
          !isDesktopScreen ? 'pt-safe-top pb-safe-bottom' : '',
        )}
        style={{
          ...styles,
          maxHeight: styles
            ? getPopoverMaxHeight(getAppRect(documentRect), anchorRect, positionedSide, positionedAlignment)
            : '',
          top: !isDesktopScreen ? `${document.documentElement.scrollTop}px` : '',
        }}
        ref={(node) => {
          setPopoverElement(node)
        }}
        data-popover={id}
      >
        <div className="md:hidden">
          <div className="flex items-center justify-end px-3 pt-2">
            <button className="rounded-full border border-border p-1" onClick={togglePopover}>
              <Icon type="close" className="h-4 w-4" />
            </button>
          </div>
          <HorizontalSeparator classes="my-2" />
        </div>
        <div className={className}>{children}</div>
      </div>
    </Portal>
  )
}

export default PositionedPopoverContent
