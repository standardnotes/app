import { RefObject, useCallback, useEffect } from 'react'
import { useLongPressEvent } from './useLongPress'
import { isIOS } from '@standardnotes/ui-services'

export const useContextMenuEvent = (elementRef: RefObject<HTMLElement>, listener: (x: number, y: number) => void) => {
  const { attachEvents, cleanupEvents } = useLongPressEvent(elementRef, listener, true)

  const handleContextMenuEvent = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      listener(event.clientX, event.clientY)
    },
    [listener],
  )

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return
    }

    const shouldUseLongPress = isIOS()

    element.addEventListener('contextmenu', handleContextMenuEvent)

    if (shouldUseLongPress) {
      attachEvents()
    }

    return () => {
      element.removeEventListener('contextmenu', handleContextMenuEvent)
      if (shouldUseLongPress) {
        cleanupEvents()
      }
    }
  }, [attachEvents, cleanupEvents, elementRef, handleContextMenuEvent, listener])
}
