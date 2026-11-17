import { SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import type { LexicalEditor } from 'lexical'
import { isRestoreEditorPositionEnabled, shouldRestoreCaret } from './shouldRestoreCaret'
import { $selectCaretTextOffset } from './superCaretOffset'

function scrollCaretToCenter(): void {
  const node = window.getSelection()?.focusNode
  const element = node instanceof HTMLElement ? node : node?.parentElement

  element?.scrollIntoView({ block: 'center' })
}

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

  let restored = false

  editor.update(
    () => {
      restored = $selectCaretTextOffset(note.lastCaretOffset)
    },
    { discrete: true },
  )

  if (restored) {
    scrollCaretToCenter()
  }
}
