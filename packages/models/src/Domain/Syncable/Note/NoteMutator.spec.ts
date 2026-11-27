import { NoteMutator } from './NoteMutator'
import { createNote } from './../../Utilities/Test/SpecUtils'
import { AppDataField, DefaultAppDomain, MutationType } from '../../Abstract/Item'
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
    mutator.setLastCaret(42)

    let result = mutator.getResult()
    expect(result.content.lastCaretOffset).toBe(42)
    expect(result.content.lastCaretAt).toEqual(expect.any(Number))

    mutator.clearLastCaret()
    result = mutator.getResult()
    expect(result.content.lastCaretOffset).toBeUndefined()
    expect(result.content.lastCaretAt).toBeUndefined()
  })

  it('stamps the last caret time after the user modified date', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.UpdateUserTimestamps)
    mutator.setLastCaret(42)

    const result = mutator.getResult()
    const userModifiedDate = new Date(
      (result.content.appData?.[DefaultAppDomain] as Record<string, string>)[AppDataField.UserModifiedDate],
    ).getTime()

    expect(result.content.lastCaretAt).toBeGreaterThanOrEqual(userModifiedDate)
  })

  it('does not stamp a last caret time when the caret was not set', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.UpdateUserTimestamps)
    mutator.title = 'title'

    expect(mutator.getResult().content.lastCaretAt).toBeUndefined()
  })
})
