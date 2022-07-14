import { useAutoElementRect } from '@/Hooks/useElementRect'
import { useState } from 'react'
import Portal from '../Portal/Portal'
import { getPositionedPopoverStyles } from './getPositionedPopoverStyles'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps

const PositionedPopoverContent = ({ align, buttonRef, children, side }: Props) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)

  const styles = getPositionedPopoverStyles({
    align,
    button: buttonRef.current,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
  })

  return (
    <Portal>
      <div
        className="absolute z-modal hidden min-w-80 max-w-xs cursor-auto flex-col overflow-y-auto rounded bg-default py-2 shadow-main md:flex"
        style={styles ? styles : {}}
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
