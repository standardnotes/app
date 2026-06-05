const EVERNOTE_HIGHLIGHT_PROPERTY =
  /(?:--en-highlight|-en-highlight|--evernote-highlight|-evernote-highlight)\s*:\s*([^;]+)/i

export function isEvernoteHighlightStyle(styleAttribute: string | null | undefined): boolean {
  if (!styleAttribute) {
    return false
  }

  const match = styleAttribute.match(EVERNOTE_HIGHLIGHT_PROPERTY)
  if (!match) {
    return false
  }

  return match[1].trim().toLowerCase() !== 'false'
}

export function isEvernoteHighlightElement(element: HTMLElement): boolean {
  if (isEvernoteHighlightStyle(element.getAttribute('style'))) {
    return true
  }

  const enHighlight = element.style.getPropertyValue('--en-highlight')
  return enHighlight !== '' && enHighlight.toLowerCase() !== 'false'
}

export function convertEvernoteHighlightSpansToMarks(root: ParentNode) {
  const spans = Array.from(root.querySelectorAll('span'))

  for (const span of spans) {
    if (!isEvernoteHighlightElement(span)) {
      continue
    }

    const mark = document.createElement('mark')
    const style = span.getAttribute('style')
    if (style) {
      mark.setAttribute('style', style)
    }

    while (span.firstChild) {
      mark.appendChild(span.firstChild)
    }

    span.replaceWith(mark)
  }
}
