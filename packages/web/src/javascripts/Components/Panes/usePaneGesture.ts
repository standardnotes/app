import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useState } from 'react'
import { Direction, Pan, PointerListener } from 'contactjs'

let panActive = false
let animationFrameId = null
let ticking = false

export const usePaneSwipeGesture = (direction: 'left' | 'right', onSwipeEnd: () => void) => {
  const [element, setElement] = useState<HTMLElement | null>(null)

  const onSwipeEndRef = useStateRef(onSwipeEnd)

  useEffect(() => {
    if (!element) {
      return
    }

    const panRecognizer = new Pan(element, {
      supportedDirections: direction === 'left' ? [Direction.Left] : [Direction.Right],
    })

    const pointerListener = new PointerListener(element, {
      supportedGestures: [panRecognizer],
    })

    function onPan(event) {
      if (panActive == false) {
        panActive = true
      }

      const x = event.detail.global.deltaX
      requestElementUpdate(x)
    }

    element.addEventListener('panleft', onPan)

    element.addEventListener('panright', onPan)

    function onPanEnd(event) {
      if (ticking) {
        setTimeout(function () {
          onPanEnd(event)
        }, 100)
      } else {
        panActive = false
        onSwipeEndRef.current()
      }
    }

    element.addEventListener('panend', onPanEnd)

    function requestElementUpdate(x: number) {
      if (!ticking) {
        animationFrameId = requestAnimationFrame(function () {
          if (!element) {
            return
          }
          element.style.left = `${direction === 'right' ? Math.max(x, 0) : Math.min(x, 0)}px`

          animationFrameId = null
          ticking = false
        })

        ticking = true
      }
    }

    return () => {
      pointerListener.destroy()
      element.removeEventListener('panleft', onPan)
      element.removeEventListener('panright', onPan)
      element.removeEventListener('panend', onPanEnd)
    }
  }, [direction, element, onSwipeEndRef])

  return [setElement]
}
