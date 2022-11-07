import { createNote } from './../../Utilities/Test/SpecUtils'

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
})
