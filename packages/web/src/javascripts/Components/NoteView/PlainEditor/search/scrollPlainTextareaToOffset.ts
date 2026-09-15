const mirrorStyleProperties = [
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRightWidth',
  'borderTopWidth',
  'boxSizing',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'tabSize',
  'textIndent',
  'textTransform',
  'whiteSpace',
  'wordSpacing',
] as const

type MatchPosition = {
  top: number
  bottom: number
}

function measureMatchPosition(textarea: HTMLTextAreaElement, start: number, end: number): MatchPosition {
  const boundedStart = Math.max(0, Math.min(start, textarea.value.length))
  const boundedEnd = Math.max(boundedStart, Math.min(end, textarea.value.length))
  const style = window.getComputedStyle(textarea)
  const mirror = document.createElement('div')
  mirror.setAttribute('aria-hidden', 'true')
  mirror.style.position = 'absolute'
  mirror.style.top = '0'
  mirror.style.left = '-9999px'
  mirror.style.visibility = 'hidden'
  mirror.style.width = `${textarea.clientWidth}px`
  mirror.style.overflowWrap = 'break-word'
  mirror.style.wordWrap = 'break-word'

  for (const property of mirrorStyleProperties) {
    mirror.style[property] = style[property]
  }

  const textBefore = textarea.value.slice(0, boundedStart)
  const matchText = textarea.value.slice(boundedStart, boundedEnd) || '\u200b'
  const textAfter = textarea.value.slice(boundedEnd)

  mirror.textContent = textBefore

  const matchSpan = document.createElement('span')
  matchSpan.textContent = matchText
  mirror.appendChild(matchSpan)

  if (textAfter) {
    mirror.appendChild(document.createTextNode(textAfter))
  }

  document.body.appendChild(mirror)

  const lineHeight = parseFloat(style.lineHeight) || matchSpan.offsetHeight || 0
  const top = matchSpan.offsetTop
  const bottom = top + (matchSpan.offsetHeight || lineHeight)

  document.body.removeChild(mirror)

  return { top, bottom }
}

export function getTargetScrollTopForMatch(textarea: HTMLTextAreaElement, start: number, end: number = start): number {
  const { top: matchTop, bottom: matchBottom } = measureMatchPosition(textarea, start, end)
  const maxScrollTop = Math.max(0, textarea.scrollHeight - textarea.clientHeight)
  const matchHeight = matchBottom - matchTop
  const targetTop = matchTop - textarea.clientHeight / 2 + matchHeight / 2

  return Math.max(0, Math.min(targetTop, maxScrollTop))
}

export function scrollPlainTextareaToOffset(textarea: HTMLTextAreaElement, start: number, end: number = start): void {
  textarea.scrollTop = getTargetScrollTopForMatch(textarea, start, end)
}
