import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useState } from 'react'
import TinyGesture from './TinyGesture'

export const usePaneSwipeGesture = (direction: 'left' | 'right', onSwipeEnd: () => void) => {
  const [element, setElement] = useState<HTMLElement | null>(null)

  const onSwipeEndRef = useStateRef(onSwipeEnd)

  useEffect(() => {
    if (!element) {
      return
    }

    const gesture = new TinyGesture(element)

    const handlePanMove = gesture.on('panmove', () => {
      const isSwipingHorizontally = gesture.swipingDirection !== 'vertical'
      if (!isSwipingHorizontally) {
        return
      }
      if (gesture.touchMoveX === null) {
        return
      }
      if (direction === 'right') {
        element.style.left = `${Math.max(gesture.touchMoveX, 0)}px`
      } else {
        element.style.left = `${Math.min(gesture.touchMoveX, 0)}px`
      }
    })

    const handlePanEnd = gesture.on('panend', () => {
      if (!gesture.touchMoveX) {
        return
      }
      /* if (gesture.touchMoveX > 40) {
        onSwipeEndRef.current()
      } else {
        element.style.left = ''
      } */
      if (gesture.touchMoveX > 40 && direction === 'right') {
        onSwipeEndRef.current()
        return
      }
      if (gesture.touchMoveX < -40 && direction === 'left') {
        onSwipeEndRef.current()
        return
      }
      element.style.left = ''
    })

    return () => {
      handlePanMove?.cancel()
      handlePanEnd?.cancel()
      gesture.destroy()
    }
  }, [direction, element, onSwipeEndRef])

  return [setElement]
}
