import { classNames } from '@/Utils/ConcatenateClassNames'
import {
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type Props = {
  children: ReactNode
  paginateFront: () => void
  paginateEnd: () => void
  direction: 'horizontal' | 'vertical'
  onElementVisibility?: (elementId: string) => void
  className?: string
}

export type InfiniteScrollerInterface = {
  scrollToElementId: (id: string) => void
}

export const InfinteScroller = forwardRef<InfiniteScrollerInterface, Props>(
  ({ children, paginateFront, paginateEnd, direction = 'vertical', onElementVisibility, className }: Props, ref) => {
    const topSentinel = useRef<HTMLDivElement | null>(null)
    const bottomSentinel = useRef<HTMLDivElement | null>(null)

    const scrollArea = useRef<HTMLDivElement | null>(null)
    const [scrollSize, setScrollSize] = useState(0)
    const [didPaginateFront, setDidPaginateFront] = useState(false)

    useImperativeHandle(ref, () => ({
      scrollToElementId(id: string) {
        scrollToElementId(id)
      },
    }))

    const visibilityObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            const visibleEntry = entries.find((entry) => entry.isIntersecting)
            if (visibleEntry) {
              onElementVisibility?.(visibleEntry.target.id)
            }
          },
          { threshold: 1.0 },
        ),
      [onElementVisibility],
    )

    useEffect(() => {
      const childElements = scrollArea.current!.children
      for (const child of Array.from(childElements)) {
        visibilityObserver.observe(child)
      }

      return () => {
        for (const child of Array.from(childElements)) {
          visibilityObserver.unobserve(child)
        }
      }
    }, [visibilityObserver, children])

    const scrollToElementId = useCallback((id: string) => {
      const element = document.getElementById(id)
      if (!element) {
        console.log('Element not found', id)
        return
      }

      element.scrollIntoView({
        behavior: 'auto',
        block: 'center',
        inline: 'center',
      })
    }, [])

    useLayoutEffect(() => {
      if (!scrollArea.current) {
        return
      }

      if (didPaginateFront) {
        if (direction === 'vertical') {
          scrollArea.current.scrollTop += scrollArea.current.scrollHeight - scrollSize
        } else {
          scrollArea.current.scrollLeft += scrollArea.current.scrollWidth - scrollSize
        }
        setDidPaginateFront(false)
      }
    }, [didPaginateFront, scrollSize, direction])

    const _paginateFront = useCallback(() => {
      if (direction === 'vertical') {
        setScrollSize(scrollArea!.current!.scrollHeight)
      } else {
        setScrollSize(scrollArea!.current!.scrollWidth)
      }
      setDidPaginateFront(true)
      paginateFront()
    }, [paginateFront, direction])

    const _paginateEnd = useCallback(() => {
      paginateEnd()
    }, [paginateEnd])

    const topObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              _paginateFront()
            }
          },
          { threshold: 0.5 },
        ),
      [_paginateFront],
    )

    useEffect(() => {
      if (topSentinel.current) {
        topObserver.observe(topSentinel.current)
      }
    }, [topObserver, topSentinel])

    const bottomObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              _paginateEnd()
            }
          },
          { threshold: 0.5 },
        ),
      [_paginateEnd],
    )

    useEffect(() => {
      if (bottomSentinel.current) {
        bottomObserver.observe(bottomSentinel.current)
      }
    }, [bottomObserver, bottomSentinel])

    return (
      <div
        ref={scrollArea}
        className={className}
        style={{
          overflowY: 'scroll',
          flexDirection: direction === 'vertical' ? 'column' : 'row',
        }}
      >
        <div style={{ width: '100%', height: 1, backgroundColor: 'blue' }} ref={topSentinel}></div>
        {children}
        <div style={{ width: '100%', height: 1, backgroundColor: 'green' }} ref={bottomSentinel}></div>
      </div>
    )
  },
)
