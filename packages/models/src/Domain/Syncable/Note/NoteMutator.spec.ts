import { NoteMutator, replaceRange } from './NoteMutator'
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

  it('should replaceRange', () => {
    const str = 'foobar'
    const result = replaceRange(str, 0, 2, 'car')

    expect(result).toEqual('carbar')
  })

  it('should addBlock to new note', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.addBlock({ type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [{ type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' }],
    })
  })

  it('should addBlock to existing note', () => {
    const note = createNote({
      blocksItem: {
        blocks: [{ type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' }],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.addBlock({ type: NoteType.RichText, id: '456', editorIdentifier: 'richy', content: 'test' })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' },
        { type: NoteType.RichText, id: '456', editorIdentifier: 'richy', content: 'test' },
      ],
    })
  })

  it('should removeBlock', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          { type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' },
          { type: NoteType.Code, id: '456', editorIdentifier: 'markdown', content: 'test' },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.removeBlock({ type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [{ type: NoteType.Code, id: '456', editorIdentifier: 'markdown', content: 'test' }],
    })
  })

  it('should changeBlockContent', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          { type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'old content 1' },
          { type: NoteType.Code, id: '456', editorIdentifier: 'markdown', content: 'old content 2' },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.changeBlockContent('123', 'new content')
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'new content' },
        { type: NoteType.Code, id: '456', editorIdentifier: 'markdown', content: 'old content 2' },
      ],
    })
  })

  it('should changeBlockSize', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          { type: NoteType.Code, id: '123', editorIdentifier: 'markdown', content: 'test' },
          { type: NoteType.Code, id: '456', editorIdentifier: 'markdown', content: 'test' },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.changeBlockSize('123', { width: 10, height: 20 })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        {
          type: NoteType.Code,
          id: '123',
          editorIdentifier: 'markdown',
          content: 'test',
          size: { width: 10, height: 20 },
        },
        { type: NoteType.Code, id: '456', editorIdentifier: 'markdown', content: 'test' },
      ],
    })
  })
})
