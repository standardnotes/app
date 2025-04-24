// CSS Custom Highlight API has been supported on Chrome & Safari for at least 2 years

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ForwardedRef, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { debounce, getScrollParent } from '../../../../Utils'

// now, but its still Nightly-only on Firefox desktop and not supported at all on Firefox Android
export const canUseCSSHiglights = !!('highlights' in CSS)

export interface SearchHighlightRendererMethods {
  setActiveHighlight(range: Range): void
  highlightMultipleRanges(ranges: Range[]): void
  clearHighlights(): void
}

export const SearchHighlightRenderer = forwardRef(
  (
    {
      shouldHighlightAll,
    }: {
      shouldHighlightAll: boolean
    },
    ref: ForwardedRef<SearchHighlightRendererMethods>,
  ) => {
    const [editor] = useLexicalComposerContext()

    const rootElement = editor.getRootElement()
    const rootElementRect = useMemo(() => {
      return rootElement?.getBoundingClientRect()
    }, [rootElement])

    const [activeHighlightRange, setActiveHighlightRange] = useState<Range>()
    const [activeHighlightRect, setActiveHighlightRect] = useState<DOMRect>()
    const [rangesToHighlight, setRangesToHighlight] = useState<Range[]>([])
    const [rangeRects, setRangeRects] = useState<DOMRect[]>([])

    const isBoundingClientRectVisible = useCallback(
      (rect: DOMRect) => {
        if (!rootElementRect) {
          return false
        }
        const rangeTop = rect.top
        const rangeBottom = rect.bottom
        const isRangeFullyHidden = rangeBottom < rootElementRect.top || rangeTop > rootElementRect.bottom
        return !isRangeFullyHidden
      },
      [rootElementRect],
    )

    const getBoundingClientRectForRangeIfVisible = useCallback(
      (range: Range) => {
        const rect = range.getBoundingClientRect()
        if (isBoundingClientRectVisible(rect)) {
          return rect
        }
        return undefined
      },
      [isBoundingClientRectVisible],
    )

    const getVisibleRectsFromRanges = useCallback(
      (ranges: Range[]) => {
        const rects: DOMRect[] = []
        if (!rootElementRect) {
          return rects
        }
        for (let i = 0; i < ranges.length; i++) {
          const range = ranges[i]
          if (!range) {
            continue
          }
          const rangeBoundingRect = range.getBoundingClientRect()
          if (!isBoundingClientRectVisible(rangeBoundingRect)) {
            continue
          }
          rects.push(rangeBoundingRect)
        }
        return rects
      },
      [isBoundingClientRectVisible, rootElementRect],
    )

    useImperativeHandle(
      ref,
      () => {
        return {
          setActiveHighlight: (range: Range) => {
            if (canUseCSSHiglights) {
              CSS.highlights.set('active-search-result', new Highlight(range))
              return
            }
            setActiveHighlightRange(range)
            setActiveHighlightRect(getBoundingClientRectForRangeIfVisible(range))
          },
          highlightMultipleRanges: (ranges: Range[]) => {
            if (canUseCSSHiglights) {
              const searchResultsHighlight = new Highlight()
              for (let i = 0; i < ranges.length; i++) {
                const range = ranges[i]
                if (!range) {
                  continue
                }
                searchResultsHighlight.add(range)
              }
              CSS.highlights.set('search-results', searchResultsHighlight)
              return
            }
            setRangesToHighlight(ranges)
          },
          clearHighlights: () => {
            if (canUseCSSHiglights) {
              CSS.highlights.clear()
              return
            }
            setRangesToHighlight([])
            setRangeRects([])
            setActiveHighlightRange(undefined)
            setActiveHighlightRect(undefined)
          },
        }
      },
      [getBoundingClientRectForRangeIfVisible],
    )

    useEffect(() => {
      if (shouldHighlightAll && !canUseCSSHiglights) {
        setRangeRects(getVisibleRectsFromRanges(rangesToHighlight))
      } else {
        setRangeRects([])
      }
    }, [getVisibleRectsFromRanges, rangesToHighlight, shouldHighlightAll])

    useEffect(() => {
      if (canUseCSSHiglights) {
        return
      }

      const rootElementScrollParent = getScrollParent(editor.getRootElement())
      if (!rootElementScrollParent) {
        return
      }

      const scrollListener = debounce(() => {
        if (activeHighlightRange) {
          setActiveHighlightRect(getBoundingClientRectForRangeIfVisible(activeHighlightRange))
        }
        if (shouldHighlightAll) {
          setRangeRects(getVisibleRectsFromRanges(rangesToHighlight))
        }
      }, 16)

      rootElementScrollParent.addEventListener('scroll', scrollListener)

      return () => {
        rootElementScrollParent.removeEventListener('scroll', scrollListener)
      }
    }, [
      activeHighlightRange,
      editor,
      getBoundingClientRectForRangeIfVisible,
      getVisibleRectsFromRanges,
      rangesToHighlight,
      shouldHighlightAll,
    ])

    if (canUseCSSHiglights || !rootElementRect) {
      return null
    }

    return (
      <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
        {activeHighlightRect && (
          <div
            className="active-search-highlight fixed z-[1000]"
            style={{
              transform: `translate(${activeHighlightRect.left - rootElementRect.left}px, ${
                activeHighlightRect.top - rootElementRect.top
              }px)`,
              width: `${activeHighlightRect.width}px`,
              height: `${activeHighlightRect.height}px`,
            }}
          />
        )}
        {rangeRects.map((rect, index) => (
          <div
            key={index}
            className="search-highlight fixed z-[1000]"
            style={{
              transform: `translate(${rect.left - rootElementRect.left}px, ${rect.top - rootElementRect.top}px)`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }}
          />
        ))}
      </div>
    )
  },
)
