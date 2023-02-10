import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useRef, useState } from 'react'
import { Direction, Pan, PointerListener, type GestureEventData } from 'contactjs'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

export const usePaneSwipeGesture = (
  direction: 'left' | 'right',
  onSwipeEnd: (element: HTMLElement) => void,
  gesture: 'pan' | 'swipe' = 'pan',
) => {
  const overlayElementRef = useRef<HTMLElement | null>(null)
  const [element, setElement] = useState<HTMLElement | null>(null)

  const onSwipeEndRef = useStateRef(onSwipeEnd)
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  useEffect(() => {
    if (!element) {
      return
    }

    if (!isMobileScreen) {
      return
    }

    const panRecognizer = new Pan(element, {
      supportedDirections: direction === 'left' ? [Direction.Left] : [Direction.Right],
    })

    const pointerListener = new PointerListener(element, {
      supportedGestures: [panRecognizer],
    })

    function onPan(e: unknown) {
      const event = e as CustomEvent<GestureEventData>
      if (!element) {
        return
      }

      const x = event.detail.global.deltaX
      requestElementUpdate(x)
    }

    let ticking = false

    function onPanEnd(e: unknown) {
      const event = e as CustomEvent<GestureEventData>
      if (ticking) {
        setTimeout(function () {
          onPanEnd(event)
        }, 100)
      } else {
        if (!element) {
          return
        }

        if (direction === 'right' && event.detail.global.deltaX > 40) {
          onSwipeEndRef.current(element)
        } else if (direction === 'left' && event.detail.global.deltaX < -40) {
          onSwipeEndRef.current(element)
        } else {
          requestElementUpdate(0)
        }

        if (overlayElementRef.current) {
          overlayElementRef.current
            .animate([{ opacity: 0 }], {
              duration: 5,
              fill: 'forwards',
            })
            .finished.then(() => {
              if (overlayElementRef.current) {
                overlayElementRef.current.remove()
                overlayElementRef.current = null
              }
            })
            .catch(console.error)
        }
      }
    }

    function requestElementUpdate(x: number) {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (!element) {
            return
          }

          if (!overlayElementRef.current) {
            const overlayElement = document.createElement('div')
            overlayElement.style.position = 'fixed'
            overlayElement.style.top = '0'
            overlayElement.style.left = '0'
            overlayElement.style.width = '100%'
            overlayElement.style.height = '100%'
            overlayElement.style.pointerEvents = 'none'
            overlayElement.style.backgroundColor = '#000'
            overlayElement.style.opacity = '0'
            overlayElement.style.willChange = 'opacity'

            element.before(overlayElement)
            overlayElementRef.current = overlayElement
          }

          const newLeft = direction === 'right' ? Math.max(x, 0) : Math.min(x, 0)
          element.animate([{ transform: `translate3d(${newLeft}px,0,0)` }], { duration: 0, fill: 'forwards' })

          const percent = Math.min(window.innerWidth / newLeft / 10, 0.45)
          overlayElementRef.current.animate([{ opacity: percent }], {
            duration: 0,
            fill: 'forwards',
          })

          ticking = false
        })

        ticking = true
      }
    }

    if (gesture === 'pan') {
      element.addEventListener('panleft', onPan)
      element.addEventListener('panright', onPan)
      element.addEventListener('panend', onPanEnd)
    } else {
      if (direction === 'left') {
        element.addEventListener('swipeleft', onPanEnd)
      } else {
        element.addEventListener('swiperight', onPanEnd)
      }
    }

    return () => {
      pointerListener.destroy()
      if (gesture === 'pan') {
        element.removeEventListener('panleft', onPan)
        element.removeEventListener('panright', onPan)
        element.removeEventListener('panend', onPanEnd)
      } else {
        if (direction === 'left') {
          element.removeEventListener('swipeleft', onPanEnd)
        } else {
          element.removeEventListener('swiperight', onPanEnd)
        }
      }
    }
  }, [direction, element, gesture, isMobileScreen, onSwipeEndRef])

  return [setElement]
}
