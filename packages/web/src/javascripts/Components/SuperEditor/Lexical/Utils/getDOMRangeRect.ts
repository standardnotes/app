function mergeRects(rects: DOMRect[]): DOMRect {
  const left = Math.min(...rects.map((rect) => rect.left))
  const top = Math.min(...rects.map((rect) => rect.top))
  const right = Math.max(...rects.map((rect) => rect.right))
  const bottom = Math.max(...rects.map((rect) => rect.bottom))

  return new DOMRect(left, top, right - left, bottom - top)
}

export function getDOMRangeRect(nativeSelection: Selection, rootElement: HTMLElement): DOMRect {
  const domRange = nativeSelection.getRangeAt(0)

  let rect

  if (nativeSelection.anchorNode === rootElement) {
    let inner = rootElement
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild as HTMLElement
    }
    rect = inner.getBoundingClientRect()
  } else {
    const clientRects = domRange.getClientRects()
    rect = mergeRects(Array.from(clientRects))
  }

  return rect
}
