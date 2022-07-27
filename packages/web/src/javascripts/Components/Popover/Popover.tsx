import { UuidGenerator } from '@standardnotes/snjs'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import PositionedPopoverContent from './PositionedPopoverContent'
import { PopoverProps } from './Types'

type PopoverContextData = {
  registerChildPopover: (id: string) => void
  unregisterChildPopover: (id: string) => void
}

const PopoverContext = createContext<PopoverContextData | null>(null)

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
  const popoverId = useRef(UuidGenerator.GenerateUuid())

  const parentPopoverContext = useContext(PopoverContext)

  useEffect(() => {
    const currentId = popoverId.current

    if (parentPopoverContext) {
      parentPopoverContext.registerChildPopover(currentId)
    }

    return () => {
      parentPopoverContext?.unregisterChildPopover(currentId)
    }
  }, [parentPopoverContext])

  const [childPopovers, setChildPopovers] = useState<Set<string>>(new Set())

  useEffect(() => {
    console.log(childPopovers)
  }, [childPopovers])

  const registerChildPopover = useCallback((id: string) => {
    setChildPopovers((childPopovers) => new Set(childPopovers.add(id)))
  }, [])

  const unregisterChildPopover = useCallback((id: string) => {
    setChildPopovers((childPopovers) => {
      childPopovers.delete(id)
      return new Set(childPopovers)
    })
  }, [])

  const contextValue = useMemo(
    () => ({
      registerChildPopover,
      unregisterChildPopover,
    }),
    [registerChildPopover, unregisterChildPopover],
  )

  return open ? (
    <PopoverContext.Provider value={contextValue}>
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
    </PopoverContext.Provider>
  ) : null
}

export default Popover
