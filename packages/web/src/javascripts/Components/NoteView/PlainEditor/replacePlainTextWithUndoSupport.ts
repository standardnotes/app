import { applyTextReplacements } from '../UniversalSearch/applyTextReplacements'
import { TextRange } from '../UniversalSearch/types'

function refocusIfConnected(element: Element | null) {
  if (element instanceof HTMLElement && element.isConnected) {
    element.focus()
  }
}

function insertTextAtRangeWithUndoSupport(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
): void {
  const previousFocus = document.activeElement

  textarea.focus()
  textarea.setSelectionRange(start, end)

  const insertedWithUndo =
    document.queryCommandSupported('insertText') && document.execCommand('insertText', false, text)

  if (!insertedWithUndo) {
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end)
    textarea.setSelectionRange(start + text.length, start + text.length)
  }

  refocusIfConnected(previousFocus)
}

export function replaceTextRangeWithUndoSupport(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string,
): string {
  insertTextAtRangeWithUndoSupport(textarea, start, end, replacement)
  return textarea.value
}

export function replaceAllTextRangesWithUndoSupport(
  textarea: HTMLTextAreaElement,
  ranges: TextRange[],
  replacement: string,
): string {
  if (ranges.length < 1) {
    return textarea.value
  }

  const previousFocus = document.activeElement
  const nextText = applyTextReplacements(textarea.value, ranges, replacement)

  textarea.focus()
  textarea.setSelectionRange(0, textarea.value.length)

  const replacedWithUndo =
    document.queryCommandSupported('insertText') && document.execCommand('insertText', false, nextText)

  if (!replacedWithUndo) {
    textarea.value = nextText
    textarea.setSelectionRange(nextText.length, nextText.length)
  }

  refocusIfConnected(previousFocus)

  return textarea.value
}
