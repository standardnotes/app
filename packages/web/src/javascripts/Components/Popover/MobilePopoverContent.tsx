import { useDisableBodyScrollOnMobile } from '@/Hooks/useDisableBodyScrollOnMobile'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useCallback, useEffect } from 'react'
import Portal from '../Portal/Portal'
import MobileModalAction from '../Modal/MobileModalAction'
import { useModalAnimation } from '../Modal/useModalAnimation'
import MobileModalHeader from '../Modal/MobileModalHeader'
import { mergeRefs } from '@/Hooks/mergeRefs'
import { DialogWithClose } from '@/Utils/CloseOpenModalsAndPopovers'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { SupportsPassiveListeners } from '@/Constants/Constants'
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
}: {
  open: boolean
  requestClose: () => void
  children: ReactNode
  title: string
  id: string
  className?: string
}) => {
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const [isMounted, setPopoverElement, element] = useModalAnimation(open, isMobileScreen)

  useEffect(() => {
    if (!element) {
      return
    }

    let startY = 0
    let closestScrollContainer: HTMLElement | null = null
    let closestScrollContainerScrollTop = 0
    let isClosestScrollContainerScrolledAtStart = false
    let containerScrollChangedAfterTouchStart = false

    const touchStartHandler = (e: TouchEvent) => {
      startY = e.touches[0].clientY
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
    const touchEndHandler = () => {
      const y = element.getBoundingClientRect().y
      const threshold = window.innerHeight * 0.75

      if (y > threshold && !isClosestScrollContainerScrolledAtStart) {
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
      <div className="fixed inset-0 z-modal">
        <div className="absolute inset-0 z-0 bg-[rgba(0,0,0,0.4)]" />
        <div
          ref={mergeRefs([setPopoverElement, addCloseMethod])}
          className="z-1 absolute bottom-0 flex max-h-[calc(100%_-_max(var(--safe-area-inset-top),2rem))] min-h-[70%] w-full flex-col rounded-t-xl bg-default pb-safe-bottom"
          id={'popover/' + id}
          data-popover={id}
          data-mobile-popover
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-passive-2" />
          <MobileModalHeader className="border-b border-border px-2 py-1.5 text-lg">
            <div />
            <div className="flex items-center justify-center font-semibold">{title}</div>
            <MobileModalAction type="primary" slot="right" action={requestClose}>
              Done
            </MobileModalAction>
          </MobileModalHeader>
          <div className={classNames('h-full overflow-y-auto', className)}>{children}</div>
        </div>
      </div>
    </Portal>
  )
}

export default MobilePopoverContent
