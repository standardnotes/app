import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { UuidGenerator } from '@standardnotes/snjs'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import MobilePopoverContent from './MobilePopoverContent'
import PositionedPopoverContent from './PositionedPopoverContent'
import { PopoverProps } from './Types'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'

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

const PositionedPopoverContentWithAnimation = (
  props: PopoverProps & {
    childPopovers: Set<string>
    id: string
  },
) => {
  const [isMounted, setElement] = useLifecycleAnimation({
    open: props.open,
    exit: {
      keyframes: [
        {
          opacity: 0,
          transform: 'scale(0.95)',
        },
      ],
      options: {
        duration: 75,
      },
    },
  })

  return isMounted ? (
    <PositionedPopoverContent setAnimationElement={setElement} {...props}>
      {props.children}
    </PositionedPopoverContent>
  ) : null
}

const Popover = (props: PopoverProps) => {
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

    if (props.open) {
      removeListener = addAndroidBackHandler(() => {
        props.togglePopover?.()
        return true
      })
    }

    return () => {
      if (removeListener) {
        removeListener()
      }
    }
  }, [addAndroidBackHandler, props, props.open])

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  if (isMobileScreen && !props.disableMobileFullscreenTakeover) {
    return (
      <MobilePopoverContent
        open={props.open}
        requestClose={() => {
          props.togglePopover?.()
        }}
        title={props.title}
        className={props.className}
        id={popoverId.current}
      >
        {props.children}
      </MobilePopoverContent>
    )
  }

  return (
    <PopoverContext.Provider value={contextValue}>
      <PositionedPopoverContentWithAnimation {...props} childPopovers={childPopovers} id={popoverId.current} />
    </PopoverContext.Provider>
  )
}

export default Popover
