import { SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import type { LexicalEditor } from 'lexical'
import { isRestoreEditorPositionEnabled, shouldRestoreCaret } from './shouldRestoreCaret'
import { $selectCaretTextOffset } from './superCaretOffset'

export function restoreSuperEditorCaret(
  editor: LexicalEditor,
  note: SNNote,
  preferences: PreferenceServiceInterface,
): void {
  if (!isRestoreEditorPositionEnabled(preferences)) {
    return
  }

  editor.getRootElement()?.focus({ preventScroll: true })

  if (!shouldRestoreCaret(note, preferences)) {
    return
  }

  editor.update(() => $selectCaretTextOffset(note.lastCaretOffset), { discrete: true })
}
