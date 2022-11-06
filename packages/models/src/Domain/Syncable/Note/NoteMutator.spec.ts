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
    mutator.addBlock({ type: NoteType.Code, id: '123', editorIdentifier: 'markdown' }, 'test')
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [{ type: NoteType.Code, id: '123', editorIdentifier: 'markdown' }],
    })
    expect(result.content.text).toEqual('<Block id=123>\ntest\n</Block id=123>')
  })

  it('should addBlock to existing note', () => {
    const note = createNote({
      text: '<Block id=123>\ntest\n</Block id=123>',
      blocksItem: {
        blocks: [{ type: NoteType.Code, id: '123', editorIdentifier: 'markdown' }],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.addBlock({ type: NoteType.RichText, id: '456', editorIdentifier: 'richy' }, 'test')
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: NoteType.Code, id: '123', editorIdentifier: 'markdown' },
        { type: NoteType.RichText, id: '456', editorIdentifier: 'richy' },
      ],
    })
    expect(result.content.text).toEqual(
      '<Block id=123>\ntest\n</Block id=123>\n\n<Block id=456>\ntest\n</Block id=456>',
    )
  })

  it('should removeBlock', () => {
    const note = createNote({
      text: '<Block id=123>\ntest\n</Block id=123>\n\n<Block id=456>\ntest\n</Block id=456>',
      blocksItem: {
        blocks: [
          { type: NoteType.Code, id: '123', editorIdentifier: 'markdown' },
          { type: NoteType.Code, id: '456', editorIdentifier: 'markdown' },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.removeBlock({ type: NoteType.Code, id: '123', editorIdentifier: 'markdown' })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [{ type: NoteType.Code, id: '456', editorIdentifier: 'markdown' }],
    })
    expect(result.content.text).toEqual('\n\n<Block id=456>\ntest\n</Block id=456>')
  })

  it('should changeBlockContent', () => {
    const note = createNote({
      text: '<Block id=123>\nold content 1\n</Block id=123>\n\n<Block id=456>\nold content 2\n</Block id=456>',
      blocksItem: {
        blocks: [
          { type: NoteType.Code, id: '123', editorIdentifier: 'markdown' },
          { type: NoteType.Code, id: '456', editorIdentifier: 'markdown' },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.changeBlockContent('123', 'new content')
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: NoteType.Code, id: '123', editorIdentifier: 'markdown' },
        { type: NoteType.Code, id: '456', editorIdentifier: 'markdown' },
      ],
    })
    expect(result.content.text).toEqual(
      '<Block id=123>\nnew content\n</Block id=123>\n\n<Block id=456>\nold content 2\n</Block id=456>',
    )
  })

  it('should changeBlockSize', () => {
    const note = createNote({
      text: '<Block id=123>test</Block id=123><Block id=456>test</Block id=456>',
      blocksItem: {
        blocks: [
          { type: NoteType.Code, id: '123', editorIdentifier: 'markdown' },
          { type: NoteType.Code, id: '456', editorIdentifier: 'markdown' },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.changeBlockSize('123', { width: 10, height: 20 })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: NoteType.Code, id: '123', editorIdentifier: 'markdown', size: { width: 10, height: 20 } },
        { type: NoteType.Code, id: '456', editorIdentifier: 'markdown' },
      ],
    })
  })
})
