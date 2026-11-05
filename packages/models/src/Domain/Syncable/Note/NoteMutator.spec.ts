import { NoteMutator } from './NoteMutator'
import { createNote } from './../../Utilities/Test/SpecUtils'
import { MutationType } from '../../Abstract/Item'
import { NativeFeatureIdentifier, NoteType } from '@standardnotes/features'

describe('note mutator', () => {
  it('sets noteType', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.noteType = NoteType.Authentication
    const result = mutator.getResult()

    expect(result.content.noteType).toEqual(NoteType.Authentication)
  })

  it('sets componentIdentifier', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.editorIdentifier = NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor
    const result = mutator.getResult()

    expect(result.content.editorIdentifier).toEqual(NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor)
  })

  it('sets and clears last caret fields', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.lastCaretOffset = 42
    mutator.lastCaretAt = 1_700_000_000_000

    let result = mutator.getResult()
    expect(result.content.lastCaretOffset).toBe(42)
    expect(result.content.lastCaretAt).toBe(1_700_000_000_000)

    mutator.clearLastCaret()
    result = mutator.getResult()
    expect(result.content.lastCaretOffset).toBeUndefined()
    expect(result.content.lastCaretAt).toBeUndefined()
  })
})
