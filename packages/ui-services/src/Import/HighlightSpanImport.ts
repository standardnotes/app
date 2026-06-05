const HIGHLIGHT_SPAN_PROPERTY =
  /(?:--en-highlight|-en-highlight|--evernote-highlight|-evernote-highlight)\s*:\s*([^;]+)/i

export function isHighlightSpanStyle(styleAttribute: string | null | undefined): boolean {
  if (!styleAttribute) {
    return false
  }

  const match = styleAttribute.match(HIGHLIGHT_SPAN_PROPERTY)
  if (!match) {
    return false
  }

  return match[1].trim().toLowerCase() !== 'false'
}

export function isHighlightSpanElement(element: HTMLElement): boolean {
  if (isHighlightSpanStyle(element.getAttribute('style'))) {
    return true
  }

  const enHighlight = element.style.getPropertyValue('--en-highlight')
  return enHighlight !== '' && enHighlight.toLowerCase() !== 'false'
}
