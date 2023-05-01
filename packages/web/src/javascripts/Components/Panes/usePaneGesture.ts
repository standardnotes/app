import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useRef, useState } from 'react'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import { useApplication } from '../ApplicationProvider'
import { ApplicationEvent, PrefKey } from '@standardnotes/snjs'
import { PrefDefaults } from '@/Constants/PrefDefaults'

function getScrollParent(node: HTMLElement | null): HTMLElement | null {
  if (!node) {
    return null
  }

  if (node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth) {
    return node
  } else {
    return getScrollParent(node.parentElement)
  }
}

const supportsPassive = (() => {
  let supportsPassive = false
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get: () => {
        supportsPassive = true
      },
    })
    window.addEventListener('test', null as never, opts)
    window.removeEventListener('test', null as never, opts)
  } catch (e) {
    /* empty */
  }
  return supportsPassive
})()

export const usePaneSwipeGesture = (
  direction: 'left' | 'right',
  onSwipeEnd: (element: HTMLElement) => void,
  gesture: 'pan' | 'swipe' = 'pan',
) => {
  const application = useApplication()

  const underlayElementRef = useRef<HTMLElement | null>(null)
  const [element, setElement] = useState<HTMLElement | null>(null)

  const onSwipeEndRef = useStateRef(onSwipeEnd)
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const [isEnabled, setIsEnabled] = useState(() =>
    application.getPreference(PrefKey.PaneGesturesEnabled, PrefDefaults[PrefKey.PaneGesturesEnabled]),
  )
  useEffect(() => {
    return application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
      setIsEnabled(application.getPreference(PrefKey.PaneGesturesEnabled, PrefDefaults[PrefKey.PaneGesturesEnabled]))
    })
  }, [application])

  useEffect(() => {
    if (!element) {
      return
    }

    if (!isMobileScreen) {
      return
    }

    if (!isEnabled) {
      return
    }

    underlayElementRef.current = element.parentElement?.querySelector(`[data-pane-underlay="${element.id}"]`) || null

    let startX = 0
    let clientX = 0
    let closestScrollContainer: HTMLElement | null
    let scrollContainerAxis: 'x' | 'y' | null = null
    let canceled = false

    const TouchMoveThreshold = 15
    const SwipeFinishThreshold = 40 + TouchMoveThreshold

    const scrollListener = () => {
      canceled = true
    }

    const touchStartListener = (event: TouchEvent) => {
      closestScrollContainer = getScrollParent(event.target as HTMLElement)
      if (closestScrollContainer) {
        closestScrollContainer.addEventListener('scroll', scrollListener)

        if (closestScrollContainer.scrollWidth > closestScrollContainer.clientWidth) {
          scrollContainerAxis = 'x'
        }
      } else {
        scrollContainerAxis = null
      }

      const touch = event.touches[0]
      startX = touch.clientX

      canceled = false

      element.style.willChange = 'transform'
    }

    const updateElement = (x: number) => {
      if (!underlayElementRef.current) {
        const underlayElement = document.createElement('div')
        underlayElement.style.position = 'fixed'
        underlayElement.style.top = '0'
        underlayElement.style.left = '0'
        underlayElement.style.width = '100%'
        underlayElement.style.height = '100%'
        underlayElement.style.pointerEvents = 'none'
        underlayElement.style.backgroundColor = '#000'
        underlayElement.style.opacity = '0'
        underlayElement.style.willChange = 'opacity'
        underlayElement.setAttribute('role', 'presentation')
        underlayElement.ariaHidden = 'true'
        underlayElement.setAttribute('data-pane-underlay', element.id)

        element.before(underlayElement)
        underlayElementRef.current = underlayElement
      }

      element.animate(
        [
          {
            transform: `translate3d(${x}px, 0, 0)`,
          },
        ],
        {
          duration: 0,
          fill: 'forwards',
        },
      )

      const percent = Math.min(window.innerWidth / x / 10, 0.45)
      underlayElementRef.current.animate([{ opacity: percent }], {
        duration: 0,
        fill: 'forwards',
      })
    }

    const touchMoveListener = (event: TouchEvent) => {
      if (scrollContainerAxis === 'x') {
        return
      }

      if (canceled) {
        return
      }

      const touch = event.touches[0]
      clientX = touch.clientX

      const deltaX = clientX - startX

      if (Math.abs(deltaX) < TouchMoveThreshold) {
        return
      }

      if (closestScrollContainer) {
        closestScrollContainer.style.touchAction = 'none'
      }

      const x =
        direction === 'right' ? Math.max(deltaX - TouchMoveThreshold, 0) : Math.min(deltaX + TouchMoveThreshold, 0)

      if (gesture === 'pan') {
        updateElement(x)
      }
    }

    const touchEndListener = () => {
      if (closestScrollContainer) {
        closestScrollContainer.removeEventListener('scroll', scrollListener)
        closestScrollContainer.style.touchAction = ''
      }

      if (canceled) {
        updateElement(0)
        return
      }

      const deltaX = clientX - startX

      element.style.willChange = ''

      if (
        (direction === 'right' && deltaX > SwipeFinishThreshold) ||
        (direction === 'left' && deltaX < -SwipeFinishThreshold)
      ) {
        onSwipeEndRef.current(element)
      } else {
        updateElement(0)
      }

      if (underlayElementRef.current) {
        underlayElementRef.current
          .animate([{ opacity: 0 }], {
            easing: 'cubic-bezier(.36,.66,.04,1)',
            duration: 500,
            fill: 'forwards',
          })
          .finished.then(() => {
            if (underlayElementRef.current) {
              underlayElementRef.current.remove()
              underlayElementRef.current = null
            }
          })
          .catch(console.error)
      }
    }

    element.addEventListener('touchstart', touchStartListener, supportsPassive ? { passive: true } : false)
    element.addEventListener('touchmove', touchMoveListener, supportsPassive ? { passive: true } : false)
    element.addEventListener('touchend', touchEndListener, supportsPassive ? { passive: true } : false)

    return () => {
      element.removeEventListener('touchstart', touchStartListener)
      element.removeEventListener('touchmove', touchMoveListener)
      element.removeEventListener('touchend', touchEndListener)
    }
  }, [direction, element, gesture, isMobileScreen, onSwipeEndRef, isEnabled])

  return [setElement]
}
