/**
 * @jest-environment jsdom
 */

import { scrollNoteToBottom } from './scrollNoteToBottom'

describe('scrollNoteToBottom', () => {
  it('delegates to superEditor.scrollToEnd for super notes', () => {
    const scrollToEnd = jest.fn(() => true)
    const superEditor = { scrollToEnd }

    const didScroll = scrollNoteToBottom({
      editorMode: 'super',
      editorContentElement: document.createElement('div'),
      superEditor,
    })

    expect(didScroll).toBe(true)
    expect(scrollToEnd).toHaveBeenCalledWith('smooth')
  })

  it('returns false for super notes without a super editor ref', () => {
    expect(
      scrollNoteToBottom({
        editorMode: 'super',
        editorContentElement: document.createElement('div'),
      }),
    ).toBe(false)
  })

  it('returns false for plain mode without a plain editor ref', () => {
    expect(
      scrollNoteToBottom({
        editorMode: 'plain',
        editorContentElement: null,
      }),
    ).toBe(false)
  })
})
