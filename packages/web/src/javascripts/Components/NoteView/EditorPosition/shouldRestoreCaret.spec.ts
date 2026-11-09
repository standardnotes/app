import { PrefKey, SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import { featureTrunkRestoreEditorPositionEnabled } from '@/FeatureTrunk'
import { shouldRestoreCaret } from './shouldRestoreCaret'

jest.mock('@/FeatureTrunk', () => ({ featureTrunkRestoreEditorPositionEnabled: jest.fn() }))

describe('shouldRestoreCaret', () => {
  const enabledAt = 1_000
  const capturedAt = 2_000

  const check = ({
    internalFeature = true,
    preference = true,
    enabled = enabledAt as number | null,
    note = {},
  } = {}) => {
    ;(featureTrunkRestoreEditorPositionEnabled as jest.Mock).mockReturnValue(internalFeature)

    const preferences = {
      getValue: (key: PrefKey, defaultValue: unknown) => {
        if (key === PrefKey.RestoreEditorPosition) {
          return preference
        }
        return key === PrefKey.RestoreEditorPositionEnabledAt ? enabled : defaultValue
      },
    } as unknown as PreferenceServiceInterface

    const validNote = {
      lastCaretOffset: 5,
      lastCaretAt: capturedAt,
      userModifiedDate: new Date(capturedAt),
      ...note,
    } as SNNote

    return shouldRestoreCaret(validNote, preferences)
  }

  it('restores a caret captured after enabling and after the last edit', () => {
    expect(check()).toBe(true)
  })

  it('does not restore when the internal feature or the preference is off', () => {
    expect(check({ internalFeature: false })).toBe(false)
    expect(check({ preference: false })).toBe(false)
  })

  it('does not restore when the note has no caret', () => {
    expect(check({ note: { lastCaretOffset: undefined } })).toBe(false)
    expect(check({ note: { lastCaretAt: undefined } })).toBe(false)
  })

  it('does not restore a caret captured before the setting was last enabled', () => {
    expect(check({ enabled: capturedAt + 1 })).toBe(false)
    expect(check({ enabled: null })).toBe(false)
  })

  it('does not restore for a conflict copy', () => {
    expect(check({ note: { conflictOf: 'original-uuid' } })).toBe(false)
  })

  it('does not restore when the note was edited after the caret was captured', () => {
    expect(check({ note: { userModifiedDate: new Date(capturedAt + 1) } })).toBe(false)
  })
})
