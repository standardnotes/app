import { FeatureIdentifier } from '@standardnotes/features'
import { noteTypeForEditorIdentifier, NoteType } from './NoteType'

describe('note type', () => {
  it('should return the correct note type for editor identifier', () => {
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.PlainEditor)).toEqual(NoteType.Plain)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.SuperEditor)).toEqual(NoteType.Super)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.MarkdownVisualEditor)).toEqual(NoteType.Markdown)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.MarkdownProEditor)).toEqual(NoteType.Markdown)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.PlusEditor)).toEqual(NoteType.RichText)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.CodeEditor)).toEqual(NoteType.Code)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.SheetsEditor)).toEqual(NoteType.Spreadsheet)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.TaskEditor)).toEqual(NoteType.Task)
    expect(noteTypeForEditorIdentifier(FeatureIdentifier.TokenVaultEditor)).toEqual(NoteType.Authentication)
    expect(noteTypeForEditorIdentifier('org.third.party')).toEqual(NoteType.Unknown)
  })
})
