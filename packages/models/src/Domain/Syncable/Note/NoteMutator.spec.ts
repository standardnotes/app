import { NoteMutator } from './NoteMutator'
import { createNote } from './../../Utilities/Test/SpecUtils'
import { MutationType } from '../../Abstract/Item'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'

describe('note mutator', () => {
  it('sets noteType', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.noteType = NoteType.Authentication
    const result = mutator.getResult()

    expect(result.content.noteType).toEqual(NoteType.Authentication)
  })

  it('sets editorIdentifier', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.editorIdentifier = FeatureIdentifier.MarkdownProEditor
    const result = mutator.getResult()

    expect(result.content.editorIdentifier).toEqual(FeatureIdentifier.MarkdownProEditor)
  })
})
