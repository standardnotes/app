import { RefObject, useCallback, useMemo, useRef } from 'react'

// According to https://reactnative.dev/docs/touchablewithoutfeedback#onlongpress
const ReactNativeLongpressDelay = 370

export const useLongPressEvent = (
  elementRef: RefObject<HTMLElement>,
  listener: (x: number, y: number) => void,
  delay = ReactNativeLongpressDelay,
) => {
  const longPressTimeout = useRef<number>()

  const clearLongPressTimeout = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
    }
  }, [])

  const createLongPressTimeout = useCallback(
    (event: PointerEvent) => {
      clearLongPressTimeout()
      longPressTimeout.current = window.setTimeout(() => {
        const x = event.clientX
        const y = event.clientY

        listener(x, y)
      }, delay)
    },
    [clearLongPressTimeout, delay, listener],
  )

  const attachEvents = useCallback(() => {
    if (!elementRef.current) {
      return
    }

    elementRef.current.addEventListener('pointerdown', createLongPressTimeout)
    elementRef.current.addEventListener('pointercancel', clearLongPressTimeout)
  }, [clearLongPressTimeout, createLongPressTimeout, elementRef])

  const cleanupEvents = useCallback(() => {
    if (!elementRef.current) {
      return
    }

    elementRef.current.removeEventListener('pointerdown', createLongPressTimeout)
    elementRef.current.removeEventListener('pointercancel', clearLongPressTimeout)
  }, [clearLongPressTimeout, createLongPressTimeout, elementRef])

  const memoizedReturn = useMemo(
    () => ({
      attachEvents,
      cleanupEvents,
    }),
    [attachEvents, cleanupEvents],
  )

  return memoizedReturn
}
