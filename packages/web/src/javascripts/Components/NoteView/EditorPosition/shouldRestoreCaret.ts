import { PrefKey, SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import { featureTrunkRestoreEditorPositionEnabled } from '@/FeatureTrunk'

export function isRestoreEditorPositionEnabled(preferences: PreferenceServiceInterface): boolean {
  return featureTrunkRestoreEditorPositionEnabled() && preferences.getValue(PrefKey.RestoreEditorPosition, false)
}

/**
 * The caret is only restored if it was captured during the current enable window and the note
 * has not been edited since it was captured.
 */
export function shouldRestoreCaret(note: SNNote, preferences: PreferenceServiceInterface): boolean {
  const enabledAt = preferences.getValue(PrefKey.RestoreEditorPositionEnabledAt)

  return (
    isRestoreEditorPositionEnabled(preferences) &&
    note.lastCaretOffset != null &&
    note.lastCaretAt != null &&
    enabledAt != null &&
    note.lastCaretAt >= enabledAt &&
    note.userModifiedDate.getTime() <= note.lastCaretAt
  )
}
