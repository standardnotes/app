import { applyTextReplacements } from '../UniversalSearch/applyTextReplacements'
import { TextRange } from '../UniversalSearch/types'

type PendingUndo = {
  previousFocus: HTMLElement
  isUndoSelection: (textarea: HTMLTextAreaElement) => boolean
}

const pendingUndo = new WeakMap<HTMLTextAreaElement, PendingUndo>()

function moveFocusOutOfEditor(textarea: HTMLTextAreaElement, previousFocus: HTMLElement) {
  textarea.setSelectionRange(0, 0)
  previousFocus.focus()
}

function handleUndoInput(event: Event) {
  const textarea = event.currentTarget as HTMLTextAreaElement
  const pending = pendingUndo.get(textarea)

  if (!pending || !(event instanceof InputEvent) || event.inputType !== 'historyUndo') {
    return
  }

  if (!pending.isUndoSelection(textarea) || !pending.previousFocus.isConnected) {
    return
  }

  pendingUndo.delete(textarea)

  // The browser restores the undone selection after this event, so it can only be cleared next frame.
  requestAnimationFrame(() => moveFocusOutOfEditor(textarea, pending.previousFocus))
}

function replaceSelection(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  text: string,
  isUndoSelection: PendingUndo['isUndoSelection'],
): string {
  const previousFocus = document.activeElement

  // Re-registering the same listener reference is a no-op, so no bookkeeping is needed.
  textarea.addEventListener('input', handleUndoInput)

  textarea.focus()
  textarea.setSelectionRange(start, end)

  const hasNativeUndoEntry = document.execCommand('insertText', false, text)
  if (!hasNativeUndoEntry) {
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end)
  }

  if (!(previousFocus instanceof HTMLElement) || previousFocus === textarea || !previousFocus.isConnected) {
    return textarea.value
  }

  if (hasNativeUndoEntry) {
    pendingUndo.set(textarea, { previousFocus, isUndoSelection })
  }

  moveFocusOutOfEditor(textarea, previousFocus)

  return textarea.value
}

export function replaceTextRangeWithUndoSupport(
  textarea: HTMLTextAreaElement,
  start: number,
  end: number,
  replacement: string,
): string {
  return replaceSelection(
    textarea,
    start,
    end,
    replacement,
    (target) => target.selectionStart === start && target.selectionEnd === end,
  )
}

export function replaceAllTextRangesWithUndoSupport(
  textarea: HTMLTextAreaElement,
  ranges: TextRange[],
  replacement: string,
): string {
  if (ranges.length < 1) {
    return textarea.value
  }

  const nextText = applyTextReplacements(textarea.value, ranges, replacement)

  return replaceSelection(
    textarea,
    0,
    textarea.value.length,
    nextText,
    (target) => target.selectionStart === 0 && target.selectionEnd === target.value.length && target.value.length > 0,
  )
}
