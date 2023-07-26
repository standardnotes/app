import { NativeFeatureIdentifier } from '@standardnotes/features'
import { noteTypeForEditorIdentifier, NoteType } from './NoteType'

describe('note type', () => {
  it('should return the correct note type for editor identifier', () => {
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.PlainEditor)).toEqual(NoteType.Plain)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.SuperEditor)).toEqual(NoteType.Super)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.MarkdownProEditor)).toEqual(NoteType.Markdown)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.PlusEditor)).toEqual(NoteType.RichText)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.CodeEditor)).toEqual(NoteType.Code)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.SheetsEditor)).toEqual(NoteType.Spreadsheet)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.TaskEditor)).toEqual(NoteType.Task)
    expect(noteTypeForEditorIdentifier(NativeFeatureIdentifier.TYPES.TokenVaultEditor)).toEqual(NoteType.Authentication)
    expect(noteTypeForEditorIdentifier('org.third.party')).toEqual(NoteType.Unknown)
  })
})
