import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useState } from 'react'
import { Direction, Pan, PointerListener } from 'contactjs'
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
    const styleElement = document.createElement('style')
    styleElement.innerHTML = `
      .panning-pane::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(200, 200, 200, var(--pan-percent, 0));
        z-index: var(--z-index-editor-title-bar);
      }
    `
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

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

    function onPan(event: any) {
      if (!element) {
        return
      }

      const x = event.detail.global.deltaX
      requestElementUpdate(x)
      element.classList.add('panning-pane')
    }

    let ticking = false

    function onPanEnd(event: any) {
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

        element.classList.remove('panning-pane')
      }
    }

    function requestElementUpdate(x: number) {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (!element) {
            return
          }
          const currentLeft = parseInt(element.style.left || '0')
          element.style.left = `${direction === 'right' ? Math.max(x, 0) : Math.min(x, 0)}px`
          element.style.setProperty('--pan-percent', `${Math.min(Math.abs(currentLeft / 200), 0.75)}`)

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
