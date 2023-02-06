import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useState } from 'react'
import { Direction, Pan, PointerListener, type GestureEventData } from 'contactjs'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

export const usePaneSwipeGesture = (
  direction: 'left' | 'right',
  onSwipeEnd: (element: HTMLElement) => void,
  gesture: 'pan' | 'swipe' = 'pan',
) => {
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

        element.parentElement?.querySelector('.pane-swipe-overlay')?.remove()
        element.parentElement?.style.removeProperty('--pan-percent')
      }
    }

    function requestElementUpdate(x: number) {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (!element) {
            return
          }

          let overlayElement: HTMLElement | null = element.parentElement!.querySelector('.pane-swipe-overlay')
          if (!overlayElement) {
            overlayElement = document.createElement('div')
            overlayElement.className = 'pane-swipe-overlay'
            overlayElement.style.position = 'fixed'
            overlayElement.style.top = '0'
            overlayElement.style.left = '0'
            overlayElement.style.width = '100%'
            overlayElement.style.height = '100%'
            overlayElement.style.pointerEvents = 'none'
            overlayElement.style.backgroundColor = '#000'
            overlayElement.style.opacity = 'var(--pan-percent, 0)'
            overlayElement.style.willChange = 'opacity'

            element.before(overlayElement)
          }

          const currentLeft = parseInt(element.style.left || '0')
          const newLeft = direction === 'right' ? Math.max(x, 0) : Math.min(x, 0)
          element.style.left = `${newLeft}px`

          const percent = Math.min(window.innerWidth / currentLeft / 10, 0.45)
          element.parentElement!.style.setProperty('--pan-percent', `${percent}`)

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
