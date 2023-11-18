import { NativeFeatureIdentifier } from '@standardnotes/features'
import { noteTypeForEditorIdentifier, NoteType } from './NoteType'

describe('note type', () => {
  it('should return the correct note type for editor identifier', () => {
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.PlainEditor)).toEqual(NoteType.Plain)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.SuperEditor)).toEqual(NoteType.Super)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor)).toEqual(NoteType.Markdown)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.DeprecatedPlusEditor)).toEqual(NoteType.RichText)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.DeprecatedCodeEditor)).toEqual(NoteType.Code)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.SheetsEditor)).toEqual(NoteType.Spreadsheet)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.DeprecatedTaskEditor)).toEqual(NoteType.Task)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.TokenVaultEditor)).toEqual(NoteType.Authentication)
    expect(noteTypeForEditorIdentifier('org.third.party')).toEqual(NoteType.Unknown)
  })
})
