import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { UuidGenerator } from '@standardnotes/snjs'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import PositionedPopoverContent from './PositionedPopoverContent'
import { PopoverProps } from './Types'

type PopoverContextData = {
  registerChildPopover: (id: string) => void
  unregisterChildPopover: (id: string) => void
}

const PopoverContext = createContext<PopoverContextData | null>(null)

const useRegisterPopoverToParent = (popoverId: string) => {
  const parentPopoverContext = useContext(PopoverContext)

  useEffect(() => {
    const currentId = popoverId

    parentPopoverContext?.registerChildPopover(currentId)

    return () => {
      parentPopoverContext?.unregisterChildPopover(currentId)
    }
  }, [parentPopoverContext, popoverId])
}

type Props = PopoverProps & {
  open: boolean
  disableClickOutside?: boolean
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
  disableClickOutside,
}: Props) => {
  const popoverId = useRef(UuidGenerator.GenerateUuid())

  const addAndroidBackHandler = useAndroidBackHandler()

  useRegisterPopoverToParent(popoverId.current)

  const [childPopovers, setChildPopovers] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    let removeListener: (() => void) | undefined

    if (open) {
      removeListener = addAndroidBackHandler(() => {
        togglePopover()
        return true
      })
    }

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, open, togglePopover])

  return open ? (
    <PopoverContext.Provider value={contextValue}>
      <PositionedPopoverContent
        align={align}
        anchorElement={anchorElement}
        anchorPoint={anchorPoint}
        childPopovers={childPopovers}
        className={className}
        id={popoverId.current}
        overrideZIndex={overrideZIndex}
        side={side}
        togglePopover={togglePopover}
        disableClickOutside={disableClickOutside}
      >
        {children}
      </PositionedPopoverContent>
    </PopoverContext.Provider>
  ) : null
}

export default Popover
