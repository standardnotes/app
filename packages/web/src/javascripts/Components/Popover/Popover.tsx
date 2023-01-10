import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { UuidGenerator } from '@standardnotes/snjs'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import MobilePopoverContent from './MobilePopoverContent'
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
  title,
  togglePopover,
  disableClickOutside,
  disableMobileFullscreenTakeover,
  maxHeight,
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
        togglePopover?.()
        return true
      })
    }

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, open, togglePopover])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobileScreen && !disableMobileFullscreenTakeover) {
    return (
      <MobilePopoverContent
        open={open}
        requestClose={() => {
          togglePopover?.()
        }}
        title={title}
        className={className}
      >
        {children}
      </MobilePopoverContent>
    )
  }

  return open ? (
    <PopoverContext.Provider value={contextValue}>
      <PositionedPopoverContent
        align={align}
        anchorElement={anchorElement}
        anchorPoint={anchorPoint}
        childPopovers={childPopovers}
        className={`popover-content-container ${className ?? ''}`}
        disableClickOutside={disableClickOutside}
        disableMobileFullscreenTakeover={disableMobileFullscreenTakeover}
        id={popoverId.current}
        maxHeight={maxHeight}
        overrideZIndex={overrideZIndex}
        side={side}
        title={title}
        togglePopover={togglePopover}
      >
        {children}
      </PositionedPopoverContent>
    </PopoverContext.Provider>
  ) : null
}

export default Popover
