import { RefObject, useCallback, useMemo, useRef } from 'react'

// According to https://reactnative.dev/docs/touchablewithoutfeedback#onlongpress
const ReactNativeLongpressDelay = 370

export const useLongPressEvent = (
  elementRef: RefObject<HTMLElement>,
  listener: (x: number, y: number) => void,
  clearOnPointerMove = false,
  delay = ReactNativeLongpressDelay,
) => {
  const longPressTimeout = useRef<number>()
  const pointerPosition = useRef<{ x: number; y: number }>()

  const clearLongPressTimeout = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current)
    }
  }, [])

  const createLongPressTimeout = useCallback(
    (event: PointerEvent) => {
      clearLongPressTimeout()
      pointerPosition.current = { x: event.clientX, y: event.clientY }
      longPressTimeout.current = window.setTimeout(() => {
        elementRef.current?.addEventListener(
          'mousedown',
          (event) => {
            event.preventDefault()
            event.stopPropagation()
          },
          { once: true, capture: true },
        )

        const x = event.clientX
        const y = event.clientY

        listener(x, y)
      }, delay)
    },
    [clearLongPressTimeout, delay, elementRef, listener],
  )

  const clearLongPressTimeoutIfMoved = useCallback(
    (event: PointerEvent) => {
      if (
        pointerPosition.current &&
        (event.clientX !== pointerPosition.current.x || event.clientY !== pointerPosition.current.y)
      ) {
        clearLongPressTimeout()
      }
    },
    [clearLongPressTimeout],
  )

  const attachEvents = useCallback(() => {
    if (!elementRef.current) {
      return
    }

    elementRef.current.addEventListener('pointerdown', createLongPressTimeout)
    if (clearOnPointerMove) {
      elementRef.current.addEventListener('pointermove', clearLongPressTimeoutIfMoved)
    }
    elementRef.current.addEventListener('pointercancel', clearLongPressTimeout)
    elementRef.current.addEventListener('pointerup', clearLongPressTimeout)
  }, [clearLongPressTimeout, clearLongPressTimeoutIfMoved, clearOnPointerMove, createLongPressTimeout, elementRef])

  const cleanupEvents = useCallback(() => {
    if (!elementRef.current) {
      return
    }

    elementRef.current.removeEventListener('pointerdown', createLongPressTimeout)
    if (clearOnPointerMove) {
      elementRef.current.removeEventListener('pointermove', clearLongPressTimeoutIfMoved)
    }
    elementRef.current.removeEventListener('pointercancel', clearLongPressTimeout)
    elementRef.current.removeEventListener('pointerup', clearLongPressTimeout)
  }, [clearLongPressTimeout, clearLongPressTimeoutIfMoved, clearOnPointerMove, createLongPressTimeout, elementRef])

  const memoizedReturn = useMemo(
    () => ({
      attachEvents,
      cleanupEvents,
    }),
    [attachEvents, cleanupEvents],
  )

  return memoizedReturn
}
