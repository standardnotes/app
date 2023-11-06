import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useCallback, useEffect } from 'react'
import Portal from '../Portal/Portal'
import MobileModalAction from '../Modal/MobileModalAction'
import { MobileModalAnimationOptions, useModalAnimation } from '../Modal/useModalAnimation'
import MobileModalHeader from '../Modal/MobileModalHeader'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { DialogWithClose } from '@/Utils/CloseOpenModalsAndPopovers'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { SupportsPassiveListeners } from '@/Constants/Constants'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { getScrollParent } from '@/Utils'

const DisableScroll = () => {
  useDisableBodyScrollOnMobile()

  return null
}

const MobilePopoverContent = ({
  open,
  requestClose,
  children,
  title,
  className,
  id,
  forceFullHeightOnMobile,
}: {
  open: boolean
  requestClose: () => void
  children: ReactNode
  title: string
  id: string
  className?: string
  forceFullHeightOnMobile?: boolean
}) => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const [isMounted, setPopoverElement, element] = useModalAnimation(open, isMobileScreen)
  const [, setUnderlayElement] = useLifecycleAnimation({
    open,
    enter: {
      keyframes: [
        {
          opacity: 0,
        },
        {
          opacity: 0.6,
        },
      ],
      options: MobileModalAnimationOptions,
    },
    exit: {
      keyframes: [
        {
          opacity: 0.6,
        },
        {
          opacity: 0,
        },
      ],
      options: MobileModalAnimationOptions,
    },
  })

  useEffect(() => {
    if (!element) {
      return
    }

    let closestScrollContainer: HTMLElement | null = null
    let elementY = 0
    let startY = 0
    let startTimestamp = Date.now()
    let closestScrollContainerScrollTop = 0
    let isClosestScrollContainerScrolledAtStart = false
    let containerScrollChangedAfterTouchStart = false

    const touchStartHandler = (e: TouchEvent) => {
      startY = e.touches[0].clientY
      elementY = element.getBoundingClientRect().y
      startTimestamp = Date.now()
      closestScrollContainer = getScrollParent(e.target as HTMLElement)
      closestScrollContainerScrollTop = closestScrollContainer?.scrollTop || 0
      isClosestScrollContainerScrolledAtStart = !!closestScrollContainer && closestScrollContainerScrollTop > 0
      containerScrollChangedAfterTouchStart = false
    }
    const touchMoveHandler = (e: TouchEvent) => {
      const deltaY = e.touches[0].clientY - startY

      const latestClosestScrollContainerScrollTop = closestScrollContainer?.scrollTop || 0
      if (latestClosestScrollContainerScrollTop !== closestScrollContainerScrollTop) {
        containerScrollChangedAfterTouchStart = true
      }
      const isClosestScrollContainerScrolled = !!closestScrollContainer && latestClosestScrollContainerScrollTop > 0

      const shouldNotDrag = isClosestScrollContainerScrolled
        ? true
        : containerScrollChangedAfterTouchStart
        ? true
        : isClosestScrollContainerScrolledAtStart

      if (deltaY < 0 || shouldNotDrag) {
        return
      }

      const y = element.getBoundingClientRect().y
      if (y > elementY && closestScrollContainer) {
        closestScrollContainer.style.overflowY = 'hidden'
      }

      element.animate(
        {
          transform: [`translate3d(0, ${deltaY}px, 0)`],
        },
        {
          duration: 0,
          fill: 'forwards',
        },
      )
    }
    const touchEndHandler = (event: TouchEvent) => {
      const y = element.getBoundingClientRect().y
      const threshold = window.innerHeight * 0.75

      const endTimestamp = Date.now()
      const deltaY = event.changedTouches[0].clientY - startY
      const velocity = deltaY / (endTimestamp - startTimestamp)

      if (y < threshold && velocity > 2) {
        requestClose()
      } else if (y > threshold && !isClosestScrollContainerScrolledAtStart) {
        requestClose()
      } else {
        element.animate(
          {
            transform: ['translate3d(0, 0, 0)'],
          },
          {
            duration: 200,
            fill: 'forwards',
          },
        )
      }

      startY = 0
      if (closestScrollContainer) {
        closestScrollContainer.style.overflowY = ''
      }
    }

    element.addEventListener('touchstart', touchStartHandler, SupportsPassiveListeners ? { passive: true } : false)
    element.addEventListener('touchmove', touchMoveHandler, SupportsPassiveListeners ? { passive: true } : false)
    element.addEventListener('touchend', touchEndHandler, SupportsPassiveListeners ? { passive: true } : false)

    return () => {
      element.removeEventListener('touchstart', touchStartHandler)
      element.removeEventListener('touchmove', touchMoveHandler)
      element.removeEventListener('touchend', touchEndHandler)
    }
  }, [element, requestClose])

  const addCloseMethod = useCallback(
    (element: HTMLDivElement | null) => {
      if (element) {
        ;(element as DialogWithClose).close = requestClose
      }
    },
    [requestClose],
  )

  if (!isMounted) {
    return null
  }

  return (
    <Portal>
      <DisableScroll />
      <div className="fixed left-0 top-0 z-modal h-full max-h-[var(--ios-viewport-height,_none)] w-full">
        <div className="absolute z-0 h-full w-full bg-passive-4 opacity-0" ref={setUnderlayElement} />
        <div
          ref={mergeRefs([setPopoverElement, addCloseMethod])}
          className={classNames(
            'z-1 absolute bottom-0 flex max-h-[calc(100%_-_max(var(--safe-area-inset-top),2rem))] min-h-[40%] w-full flex-col rounded-t-xl bg-passive-5 pb-safe-bottom',
            forceFullHeightOnMobile && 'h-full',
          )}
          style={{
            boxShadow: '0px -4px 8px rgba(0, 0, 0, 0.075)',
          }}
          id={'popover/' + id}
          data-popover={id}
          data-mobile-popover
        >
          <div className="w-full rounded-t-xl bg-default">
            <div className="mx-auto mt-2 min-h-[0.3rem] w-12 rounded-full bg-passive-2" />
          </div>
          <MobileModalHeader className="border-b border-border bg-default px-2 py-1.5 text-lg">
            <div />
            <div className="flex items-center justify-center font-semibold">{title}</div>
            <MobileModalAction type="primary" slot="right" action={requestClose}>
              Done
            </MobileModalAction>
          </MobileModalHeader>
          <div className={classNames('h-full overflow-y-auto overscroll-none bg-passive-5', className)}>{children}</div>
        </div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
