import { createNote } from './../../Utilities/Test/SpecUtils'
import { BlockType } from './NoteBlocks'

describe('SNNote Tests', () => {
  it('should safely type required fields of Note when creating from PayloadContent', () => {
    const note = createNote({
      title: 'Expected string',
      text: ['unexpected array'] as never,
      preview_plain: 'Expected preview',
      preview_html: {} as never,
      hidePreview: 'string' as never,
    })

    expect([
      typeof note.title,
      typeof note.text,
      typeof note.preview_html,
      typeof note.preview_plain,
      typeof note.hidePreview,
    ]).toStrictEqual(['string', 'string', 'string', 'string', 'boolean'])
  })

  it('should preserve falsy values when casting from PayloadContent', () => {
    const note = createNote({
      preview_plain: null as never,
      preview_html: undefined,
    })

    expect(note.preview_plain).toBeFalsy()
    expect(note.preview_html).toBeFalsy()
  })

  it('should not set default value for note type if none is provided', () => {
    const note = createNote({})

    expect(note.noteType).toBe(undefined)
  })

  it('should getBlock', () => {
    const note = createNote({
      text: 'some text',
      blocksItem: {
        blocks: [
          {
            id: '123',
            type: BlockType.Component,
            componentIdentifier: '456',
            content: 'foo',
            previewPlain: 'foo',
          },
        ],
      },
    })

    expect(note.getBlock('123')).toStrictEqual({
      id: '123',
      type: BlockType.Component,
      componentIdentifier: '456',
      content: 'foo',
    })
  })

  it('should getBlock with no blocks', () => {
    const note = createNote({
      text: 'some text',
    })

    expect(note.getBlock('123')).toBe(undefined)
  })

  it('should getBlock with no blocksItem', () => {
    const note = createNote({
      text: 'some text',
    })

    expect(note.getBlock('123')).toBe(undefined)
  })

  it('should get indexOfBlock', () => {
    const note = createNote({
      text: 'some text',
      blocksItem: {
        blocks: [
          {
            id: '123',
            type: BlockType.Component,
            componentIdentifier: '456',
            content: 'foo',
            previewPlain: 'foo',
          },
        ],
      },
    })

    expect(note.indexOfBlock({ id: '123' })).toBe(0)
  })
})
