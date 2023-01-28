import { useStateRef } from '@/Hooks/useStateRef'
import { useEffect, useState } from 'react'
import TouchSweep from './touchsweep'

export const usePaneGesture = ({
  onSwipeLeft,
  onSwipeRight,
}: {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
} = {}) => {
  const [element, setElement] = useState<HTMLElement | null>(null)

  const onSwipeLeftRef = useStateRef(onSwipeLeft)
  const onSwipeRightRef = useStateRef(onSwipeRight)

  useEffect(() => {
    if (!element) {
      return
    }

    const touchSweep = new TouchSweep(element, {}, 40)

    const handleSwipeLeft = (e: Event): void => {
      if (onSwipeLeftRef.current) {
        onSwipeLeftRef.current()
      }
    }

    const handleSwipeRight = (e: Event): void => {
      if (onSwipeRightRef.current) {
        onSwipeRightRef.current()
      }
    }

    element.addEventListener('swipeleft', handleSwipeLeft)
    element.addEventListener('swiperight', handleSwipeRight)

    return () => {
      element.removeEventListener('swipeleft', handleSwipeLeft)
      element.removeEventListener('swiperight', handleSwipeRight)
      touchSweep.unbind()
    }
  }, [element, onSwipeLeftRef, onSwipeRightRef])

  return [setElement]
}
