import { SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import { scrollPlainTextareaToOffset } from '../PlainEditor/search/scrollPlainTextareaToOffset'
import { isRestoreEditorPositionEnabled, shouldRestoreCaret } from './shouldRestoreCaret'

/**
 * Focuses the editor whenever the setting is enabled, since a textarea only draws a caret while focused,
 * then moves the caret to where it was left off if there is a valid position to restore.
 */
export function restorePlainEditorCaret(
  textarea: HTMLTextAreaElement,
  note: SNNote,
  preferences: PreferenceServiceInterface,
): void {
  if (!isRestoreEditorPositionEnabled(preferences)) {
    return
  }

  textarea.focus({ preventScroll: true })

  if (!shouldRestoreCaret(note, preferences)) {
    return
  }

  const offset = Math.min(Math.max(note.lastCaretOffset, 0), textarea.value.length)

  textarea.setSelectionRange(offset, offset)
  scrollPlainTextareaToOffset(textarea, offset)
}
