import { useState } from 'react'
import { getPositionedPopoverStyles } from './getPositionedPopoverStyles'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps

const PopoverContent = ({ align, buttonRef, children, side }: Props) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)

  const styles = getPositionedPopoverStyles({
    popper: popoverElement,
    button: buttonRef.current,
    side,
    align,
  })

  return (
    <div
      className="absolute z-footer-bar-item-panel flex min-w-80 max-w-xs cursor-auto flex-col overflow-y-auto rounded bg-default py-2 shadow-main"
      style={styles ? styles : {}}
      ref={(node) => {
        setPopoverElement(node)
      }}
    >
      {children}
    </div>
  )
}

export default PopoverContent
