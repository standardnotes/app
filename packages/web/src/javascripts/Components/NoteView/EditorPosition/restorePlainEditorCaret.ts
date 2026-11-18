import { SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import { isRestoreEditorPositionEnabled, shouldRestoreCaret } from './shouldRestoreCaret'

export function restorePlainEditorCaret(
  textarea: HTMLTextAreaElement,
  note: SNNote,
  preferences: PreferenceServiceInterface,
): void {
  if (!isRestoreEditorPositionEnabled(preferences)) {
    return
  }

  if (!shouldRestoreCaret(note, preferences)) {
    textarea.focus({ preventScroll: true })
    return
  }

  const offset = Math.min(Math.max(note.lastCaretOffset, 0), textarea.value.length)

  textarea.setSelectionRange(offset, offset)
  textarea.focus()
}
