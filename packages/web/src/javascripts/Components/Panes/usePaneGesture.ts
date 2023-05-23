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
  options?: {
    gesture?: 'swipe' | 'pan'
    requiresStartFromEdge?: boolean
  },
) => {
  const { gesture = 'pan', requiresStartFromEdge = true } = options || {}
  const application = useApplication()

  const underlayElementRef = useRef<HTMLElement | null>(null)
  const [element, setElement] = useState<HTMLElement | null>(null)

  const onSwipeEndRef = useStateRef(onSwipeEnd)
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const adjustedGesture = gesture === 'pan' && prefersReducedMotion ? 'swipe' : gesture

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

    const TouchMoveThreshold = 25
    const TouchStartThreshold = direction === 'right' ? 25 : window.innerWidth - 25
    const SwipeFinishThreshold = window.innerWidth / 2.5

    const scrollListener = (event: Event) => {
      canceled = true

      setTimeout(() => {
        if ((event.target as HTMLElement).style.overflowY === 'hidden') {
          canceled = false
        }
      }, 5)
    }

    const touchStartListener = (event: TouchEvent) => {
      startX = 0
      clientX = 0
      scrollContainerAxis = null
      canceled = false

      const touch = event.touches[0]
      startX = touch.clientX

      const isStartOutOfThreshold =
        (direction === 'right' && startX > TouchStartThreshold) ||
        (direction === 'left' && startX < TouchStartThreshold)

      if (isStartOutOfThreshold && requiresStartFromEdge) {
        canceled = true
        return
      }

      closestScrollContainer = getScrollParent(event.target as HTMLElement)
      if (closestScrollContainer) {
        closestScrollContainer.addEventListener('scroll', scrollListener, supportsPassive ? { passive: true } : false)

        if (closestScrollContainer.scrollWidth > closestScrollContainer.clientWidth) {
          scrollContainerAxis = 'x'
        }
      }

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
        if (adjustedGesture === 'pan') {
          underlayElement.style.backgroundColor = '#000'
        } else {
          underlayElement.style.background =
            direction === 'right'
              ? 'linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0))'
              : 'linear-gradient(to left, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0))'
        }
        underlayElement.style.opacity = '0'
        underlayElement.style.willChange = 'opacity'
        underlayElement.setAttribute('role', 'presentation')
        underlayElement.ariaHidden = 'true'
        underlayElement.setAttribute('data-pane-underlay', element.id)

        if (adjustedGesture === 'pan') {
          element.before(underlayElement)
        } else {
          element.after(underlayElement)
        }
        underlayElementRef.current = underlayElement
      }

      if (adjustedGesture === 'pan') {
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
      }

      const percent =
        adjustedGesture === 'pan'
          ? Math.min(window.innerWidth / Math.abs(x) / 10, 0.65)
          : Math.min(Math.abs(x) / 100, 0.65)
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

      if (closestScrollContainer && closestScrollContainer.style.overflowY !== 'hidden') {
        closestScrollContainer.style.overflowY = 'hidden'
      }

      if (document.activeElement) {
        ;(document.activeElement as HTMLElement).blur()
      }

      if (adjustedGesture === 'pan') {
        const x =
          direction === 'right' ? Math.max(deltaX - TouchMoveThreshold, 0) : Math.min(deltaX + TouchMoveThreshold, 0)
        updateElement(x)
      } else {
        const x = direction === 'right' ? Math.max(deltaX, 0) : Math.min(deltaX, 0)
        updateElement(x)
      }
    }

    const disposeUnderlay = () => {
      if (!underlayElementRef.current) {
        return
      }

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

    const touchEndListener = () => {
      if (closestScrollContainer) {
        closestScrollContainer.removeEventListener('scroll', scrollListener)
        closestScrollContainer.style.overflowY = ''
      }

      if (canceled) {
        updateElement(0)
        disposeUnderlay()
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

      disposeUnderlay()
    }

    element.addEventListener('touchstart', touchStartListener, supportsPassive ? { passive: true } : false)
    element.addEventListener('touchmove', touchMoveListener, supportsPassive ? { passive: true } : false)
    element.addEventListener('touchend', touchEndListener, supportsPassive ? { passive: true } : false)

    return () => {
      element.removeEventListener('touchstart', touchStartListener)
      element.removeEventListener('touchmove', touchMoveListener)
      element.removeEventListener('touchend', touchEndListener)
      disposeUnderlay()
    }
  }, [direction, element, isMobileScreen, onSwipeEndRef, isEnabled, adjustedGesture, requiresStartFromEdge])

  return [setElement]
}
