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

import { LoggingDomain, log } from '@/Logging'

type Props = {
  children: ReactNode
  paginateFront: () => void
  paginateEnd: () => void
  direction: 'horizontal' | 'vertical'
  onElementVisibility?: (elementId: string) => void
  className?: string
  isMobileScreen?: boolean
}

export type InfiniteScrollerInterface = {
  scrollToElementId: (id: string) => void
}

export const InfinteScroller = forwardRef<InfiniteScrollerInterface, Props>(
  (
    {
      children,
      paginateFront,
      paginateEnd,
      direction = 'vertical',
      onElementVisibility,
      className,
      isMobileScreen,
    }: Props,
    ref,
  ) => {
    const frontSentinel = useRef<HTMLDivElement | null>(null)
    const endSentinel = useRef<HTMLDivElement | null>(null)
    const [ignoreFirstFrontSentinelEvent, setIgnoreFirstFrontSentinelEvent] = useState(true)
    const [needsMobilePaginationFix, setNeedsMobilePaginationFix] = useState(false)

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
      const childElements = Array.from(scrollArea.current!.children)
      for (const child of childElements) {
        visibilityObserver.observe(child)
      }

      return () => {
        for (const child of childElements) {
          visibilityObserver.unobserve(child)
        }
      }
    }, [visibilityObserver, children])

    const scrollToElementId = useCallback((id: string) => {
      const element = document.getElementById(id)
      if (!element) {
        log(LoggingDomain.DailyNotes, 'Element not found', id)
        return
      }

      log(LoggingDomain.DailyNotes, 'Scrolling to element', id)
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
          if (isMobileScreen) {
            setNeedsMobilePaginationFix(true)
          }
        } else {
          scrollArea.current.scrollLeft += scrollArea.current.scrollWidth - scrollSize
        }
        setDidPaginateFront(false)
      }
    }, [didPaginateFront, scrollSize, direction, isMobileScreen])

    useLayoutEffect(() => {
      /**
       * iOS Safari has an issue rendering paginated items from the top where the new
       * scrolled to area is white until the user interacts with scroll again. The fix
       * we apply is to re-set scrollTop to its same value to trigger a refresh.
       * https://stackoverflow.com/questions/9807620
       */
      if (needsMobilePaginationFix) {
        setTimeout(() => {
          if (!scrollArea.current) {
            return
          }

          log(LoggingDomain.DailyNotes, '[InfiniteScroller] Applying mobile pagination fix')
          scrollArea.current.scrollTop += scrollArea.current.scrollHeight - scrollSize
          setNeedsMobilePaginationFix(false)
        }, 50)
      }
    }, [needsMobilePaginationFix, scrollSize])

    const _paginateFront = useCallback(() => {
      if (direction === 'vertical') {
        setScrollSize(scrollArea.current!.scrollHeight)
      } else {
        setScrollSize(scrollArea.current!.scrollWidth)
      }
      setDidPaginateFront(true)
      paginateFront()
    }, [paginateFront, direction])

    const _paginateEnd = useCallback(() => {
      paginateEnd()
    }, [paginateEnd])

    const frontObserver = useMemo(
      () =>
        new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              if (ignoreFirstFrontSentinelEvent) {
                log(LoggingDomain.DailyNotes, '[InfiniteScroller] Ignoring first front sentinel event')
                setIgnoreFirstFrontSentinelEvent(false)
                return
              }
              _paginateFront()
            }
          },
          { threshold: 0.5 },
        ),
      [_paginateFront, ignoreFirstFrontSentinelEvent],
    )

    useEffect(() => {
      if (frontSentinel.current) {
        frontObserver.observe(frontSentinel.current)
      }
    }, [frontObserver, frontSentinel])

    const endObserver = useMemo(
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
      if (endSentinel.current) {
        endObserver.observe(endSentinel.current)
      }
    }, [endObserver, endSentinel])

    return (
      <div
        ref={scrollArea}
        className={className}
        style={{
          overflowY: 'scroll',
          flexDirection: direction === 'vertical' ? 'column' : 'row',
        }}
      >
        <div style={{ width: 1, height: 1, backgroundColor: 'transparent' }} ref={frontSentinel}></div>
        {children}
        <div style={{ width: 1, height: 1, backgroundColor: 'transparent' }} ref={endSentinel}></div>
      </div>
    )
  },
)
