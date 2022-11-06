import { NoteMutator } from './NoteMutator'
import { createNote } from './../../Utilities/Test/SpecUtils'
import { MutationType } from '../../Abstract/Item'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { BlockType } from './NoteBlocks'

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
    mutator.editorIdentifier = FeatureIdentifier.MarkdownProEditor
    const result = mutator.getResult()

    expect(result.content.editorIdentifier).toEqual(FeatureIdentifier.MarkdownProEditor)
  })

  it('should addBlock to new note', () => {
    const note = createNote({})
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.addBlock({
      type: BlockType.Component,
      id: '123',
      componentIdentifier: 'markdown',
      content: 'test',
      previewPlain: 'test',
    })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [{ type: NoteType.Code, id: '123', componentIdentifier: 'markdown', content: 'test' }],
    })
  })

  it('should addBlock to existing note', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          {
            type: BlockType.Component,
            id: '123',
            componentIdentifier: 'markdown',
            content: 'test',
            previewPlain: 'test',
          },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.addBlock({
      type: BlockType.Component,
      id: '456',
      componentIdentifier: 'richy',
      content: 'test',
      previewPlain: 'test',
    })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: BlockType.Component, id: '123', componentIdentifier: 'markdown', content: 'test' },
        { type: NoteType.RichText, id: '456', componentIdentifier: 'richy', content: 'test' },
      ],
    })
  })

  it('should removeBlock', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          {
            type: BlockType.Component,
            id: '123',
            componentIdentifier: 'markdown',
            content: 'test',
            previewPlain: 'test',
          },
          {
            type: BlockType.Component,
            id: '456',
            componentIdentifier: 'markdown',
            content: 'test',
            previewPlain: 'test',
          },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.removeBlock({
      type: BlockType.Component,
      id: '123',
      componentIdentifier: 'markdown',
      content: 'test',
      previewPlain: 'test',
    })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [{ type: BlockType.Component, id: '456', componentIdentifier: 'markdown', content: 'test' }],
    })
  })

  it('should changeBlockContent', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          {
            type: BlockType.Component,
            id: '123',
            componentIdentifier: 'markdown',
            content: 'old content 1',
            previewPlain: 'test',
          },
          {
            type: BlockType.Component,
            id: '456',
            componentIdentifier: 'markdown',
            content: 'old content 2',
            previewPlain: 'test',
          },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.changeBlockValues('123', { content: 'new content', previewPlain: 'new content' })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        { type: BlockType.Component, id: '123', componentIdentifier: 'markdown', content: 'new content' },
        { type: BlockType.Component, id: '456', componentIdentifier: 'markdown', content: 'old content 2' },
      ],
    })
  })

  it('should changeBlockSize', () => {
    const note = createNote({
      blocksItem: {
        blocks: [
          {
            type: BlockType.Component,
            id: '123',
            componentIdentifier: 'markdown',
            content: 'test',
            previewPlain: 'test',
          },
          {
            type: BlockType.Component,
            id: '456',
            componentIdentifier: 'markdown',
            content: 'test',
            previewPlain: 'test',
          },
        ],
      },
    })
    const mutator = new NoteMutator(note, MutationType.NoUpdateUserTimestamps)
    mutator.changeBlockSize('123', { width: 10, height: 20 })
    const result = mutator.getResult()

    expect(result.content.blocksItem).toEqual({
      blocks: [
        {
          type: BlockType.Component,
          id: '123',
          componentIdentifier: 'markdown',
          content: 'test',
          size: { width: 10, height: 20 },
        },
        { type: BlockType.Component, id: '456', componentIdentifier: 'markdown', content: 'test' },
      ],
    })
  })
})
