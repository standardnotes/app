import { RefObject, useCallback, useMemo, useRef } from 'react'

const ReactNativeLongpressDelay = 400

export const useLongPressEvent = (
  elementRef: RefObject<HTMLElement>,
  listener: () => void,
  delay = ReactNativeLongpressDelay,
) => {
  const longPressTimeout = useRef<number>()

  const clearLongPressTimeout = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
    }
  }, [])

  const createLongPressTimeout = useCallback(() => {
    clearLongPressTimeout()
    longPressTimeout.current = window.setTimeout(listener, delay)
  }, [clearLongPressTimeout, delay, listener])

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
