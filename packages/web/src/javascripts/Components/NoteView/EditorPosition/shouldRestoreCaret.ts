import { PrefKey, SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import { featureTrunkRestoreEditorPositionEnabled } from '@/FeatureTrunk'

export function isRestoreEditorPositionEnabled(preferences: PreferenceServiceInterface): boolean {
  return featureTrunkRestoreEditorPositionEnabled() && preferences.getValue(PrefKey.RestoreEditorPosition, false)
}

export function shouldRestoreCaret(
  note: SNNote,
  preferences: PreferenceServiceInterface,
): note is SNNote & { lastCaretOffset: number } {
  const enabledAt = preferences.getValue(PrefKey.RestoreEditorPositionEnabledAt)

  return (
    isRestoreEditorPositionEnabled(preferences) &&
    !note.conflictOf &&
    note.lastCaretOffset != null &&
    note.lastCaretAt != null &&
    enabledAt != null &&
    note.lastCaretAt >= enabledAt &&
    note.userModifiedDate.getTime() <= note.lastCaretAt
  )
}
