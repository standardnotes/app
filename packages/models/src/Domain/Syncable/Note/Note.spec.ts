import { createNote } from './../../Utilities/Test/SpecUtils'
import { ConflictStrategy } from '../../Abstract/Item/Types/ConflictStrategy'
import { ItemContentsDiffer } from '../../Utilities/Item/ItemContentsDiffer'

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

  describe('caret fields and conflicts', () => {
    it('should not consider notes different when only the caret differs', () => {
      const base = createNote({ text: 'same', lastCaretOffset: 1, lastCaretAt: 100 })
      const incoming = createNote({ text: 'same', lastCaretOffset: 3, lastCaretAt: 200 })

      expect(ItemContentsDiffer(base, incoming)).toBe(false)
      expect(base.strategyWhenConflictingWithItem(incoming)).toBe(ConflictStrategy.KeepApply)
    })

    it('should still consider notes different when the text differs', () => {
      const base = createNote({ text: 'one', lastCaretOffset: 1, lastCaretAt: 100 })
      const incoming = createNote({ text: 'two', lastCaretOffset: 1, lastCaretAt: 100 })

      expect(ItemContentsDiffer(base, incoming)).toBe(true)
    })
  })
})
