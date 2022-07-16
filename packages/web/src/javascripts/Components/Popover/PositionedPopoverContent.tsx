import { useDocumentRect } from '@/Hooks/useDocumentRect'
import { useAutoElementRect } from '@/Hooks/useElementRect'
import { useState } from 'react'
import Portal from '../Portal/Portal'
import { getPositionedPopoverStyles } from './getPositionedPopoverStyles'
import { CommonPopoverProps } from './types'

type Props = CommonPopoverProps

const PositionedPopoverContent = ({ align = 'end', buttonRef, children, side = 'bottom' }: Props) => {
  const [popoverElement, setPopoverElement] = useState<HTMLDivElement | null>(null)
  const popoverRect = useAutoElementRect(popoverElement)
  const buttonRect = useAutoElementRect(buttonRef.current)
  const documentRect = useDocumentRect()

  const styles = getPositionedPopoverStyles({
    align,
    buttonRect,
    documentRect,
    popoverRect: popoverRect ?? popoverElement?.getBoundingClientRect(),
    side,
  })

  return (
    <Portal>
      <div
        className="absolute z-modal hidden min-w-80 max-w-xs cursor-auto flex-col overflow-y-auto rounded bg-default py-2 shadow-main md:flex"
        style={Object.assign({}, styles)}
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
