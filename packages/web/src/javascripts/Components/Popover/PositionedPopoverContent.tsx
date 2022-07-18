import { useDocumentRect } from '@/Hooks/useDocumentRect'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useState } from 'react'
import Icon from '../Icon/Icon'
import Portal from '../Portal/Portal'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { getPositionedPopoverStyles } from './getPositionedPopoverStyles'
import { CommonPopoverProps } from './types'
import { getPopoverMaxHeight, getAppRect } from './utils/rect'

type Props = CommonPopoverProps

const PositionedPopoverContent = ({
  align = 'end',
  buttonRef,
  children,
  overrideZIndex,
  side = 'bottom',
  togglePopover,
}: Props) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)
  const buttonRect = useAutoElementRect(buttonRef.current, {
    updateOnWindowResize: true,
  })
  const documentRect = useDocumentRect()

  const [styles, positionedSide, positionedAlignment] = getPositionedPopoverStyles({
    align,
    buttonRect,
    documentRect,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
  })

  return (
    <Portal>
      <div
        className={classNames(
          'absolute top-0 left-0 flex h-full w-full min-w-80 cursor-auto flex-col overflow-y-auto rounded bg-default py-2 shadow-main md:h-auto md:max-w-xs',
          overrideZIndex ? overrideZIndex : 'z-dropdown-menu',
        )}
        style={{
          ...styles,
          maxHeight: getPopoverMaxHeight(getAppRect(documentRect), buttonRect, positionedSide, positionedAlignment),
        }}
        ref={(node) => {
          setPopoverElement(node)
        }}
      >
        <div className="md:hidden">
          <div className="flex items-center justify-end px-3">
            <button className="rounded-full border border-border p-1" onClick={togglePopover}>
              <Icon type="close" className="h-4 w-4" />
            </button>
          </div>
          <HorizontalSeparator classes="my-2" />
        </div>
        {children}
      </div>
    </Portal>
  )
}

export default PositionedPopoverContent
