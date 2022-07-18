import { useDocumentRect } from '@/Hooks/useDocumentRect'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useState } from 'react'
import Portal from '../Portal/Portal'
import { getPositionedPopoverStyles } from './getPositionedPopoverStyles'
import { CommonPopoverProps } from './types'
import { getPopoverMaxHeight, getAppRect } from './utils/rect'

type Props = CommonPopoverProps

const PositionedPopoverContent = ({ align = 'end', buttonRef, children, side = 'bottom', overrideZIndex }: Props) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)
  const buttonRect = useAutoElementRect(buttonRef.current)
  const documentRect = useDocumentRect()

  const [styles, positionedSide, positionedAlignment] = getPositionedPopoverStyles({
    align,
    buttonElement: buttonRef.current,
    documentRect,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
  })

  return (
    <Portal>
      <div
        className={classNames(
          'absolute hidden min-w-80 max-w-xs cursor-auto flex-col overflow-y-auto rounded bg-default py-2 shadow-main md:flex',
          overrideZIndex ? overrideZIndex : 'z-dropdown-menu',
        )}
        style={Object.assign({}, styles, {
          maxHeight: getPopoverMaxHeight(getAppRect(documentRect), buttonRect, positionedSide, positionedAlignment),
        })}
        ref={(node) => {
          setPopoverElement(node)
        }}
      >
        {children}
      </div>
    </Portal>
  )
}

export default PositionedPopoverContent
