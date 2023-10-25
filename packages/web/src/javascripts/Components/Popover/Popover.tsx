import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
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
      reducedMotionKeyframes: [
        {
          opacity: 0,
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
  const popoverId = useId()

  const addAndroidBackHandler = useAndroidBackHandler()

  useRegisterPopoverToParent(popoverId)

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

  useEffect(() => {
    const anchorElement =
      props.anchorElement && 'current' in props.anchorElement ? props.anchorElement.current : props.anchorElement

    if (anchorElement) {
      anchorElement.setAttribute('aria-haspopup', 'true')
      if (props.open) {
        anchorElement.setAttribute('aria-expanded', 'true')
      } else {
        anchorElement.removeAttribute('aria-expanded')
      }
    }

    return () => {
      if (anchorElement) {
        anchorElement.removeAttribute('aria-haspopup')
        anchorElement.removeAttribute('aria-expanded')
      }
    }
  }, [props.anchorElement, props.open])

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
        id={popoverId}
        forceFullHeightOnMobile={props.forceFullHeightOnMobile}
      >
        {props.children}
      </MobilePopoverContent>
    )
  }

  return (
    <PopoverContext.Provider value={contextValue}>
      <PositionedPopoverContentWithAnimation {...props} childPopovers={childPopovers} id={popoverId} />
    </PopoverContext.Provider>
  )
}

export default Popover
