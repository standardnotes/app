import { useEffect, useState } from 'react'

const DebounceTimeInMs = 100

type Options = {
  updateOnWindowResize: boolean
}

/**
 * Returns the bounding rect of an element, auto-updated when the element resizes.
 * Can optionally be auto-update on window resize.
 */
export const useAutoElementRect = (
  element: HTMLElement | null | undefined,
  { updateOnWindowResize }: Options = { updateOnWindowResize: false },
) => {
  const [rect, setRect] = useState<DOMRect>()

  useEffect(() => {
    let windowResizeDebounceTimeout: number
    let windowResizeHandler: () => void

    if (element) {
      const resizeObserver = new ResizeObserver(() => {
        setRect(element.getBoundingClientRect())
      })
      resizeObserver.observe(element)

      if (updateOnWindowResize) {
        windowResizeHandler = () => {
          window.clearTimeout(windowResizeDebounceTimeout)

          window.setTimeout(() => {
            setRect(element.getBoundingClientRect())
          }, DebounceTimeInMs)
        }
        window.addEventListener('resize', windowResizeHandler)
      }

      return () => {
        resizeObserver.unobserve(element)
        if (windowResizeHandler) {
          window.removeEventListener('resize', windowResizeHandler)
        }
      }
    } else {
      setRect(undefined)
      return
    }
  }, [element, updateOnWindowResize])

  return rect
}

export const useElementResize = (element: HTMLElement | null | undefined, callback: () => void) => {
  useEffect(() => {
    let windowResizeDebounceTimeout: number
    let windowResizeHandler: () => void

    if (element) {
      const resizeObserver = new ResizeObserver(() => {
        callback()
      })
      resizeObserver.observe(element)

      windowResizeHandler = () => {
        window.clearTimeout(windowResizeDebounceTimeout)

        window.setTimeout(() => {
          callback()
        }, DebounceTimeInMs)
      }
      window.addEventListener('resize', windowResizeHandler)

      return () => {
        resizeObserver.unobserve(element)
        window.removeEventListener('resize', windowResizeHandler)
      }
    } else {
      return
    }
  }, [element, callback])
}
