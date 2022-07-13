import { useEffect, useState } from 'react'

/**
 * Returns the bounding rect of an element, auto-updated when the element resizes
 */
export const useAutoElementRect = (element: HTMLElement | null) => {
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => {
    if (element) {
      const resizeObserver = new ResizeObserver(() => {
        setRect(element.getBoundingClientRect())
      })

      resizeObserver.observe(element)

      return () => resizeObserver.unobserve(element)
    } else {
      setRect(undefined)
      return
    }
  }, [element])

  return rect
}
