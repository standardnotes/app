/**
 * @jest-environment jsdom
 */

import { scrollNoteToBottom } from './scrollNoteToBottom'

describe('scrollNoteToBottom', () => {
  it('delegates to superScrollToEnd when provided for super notes', () => {
    const superScrollToEnd = jest.fn()

    const didScroll = scrollNoteToBottom(
      {
        editorMode: 'super',
        editorContentElement: document.createElement('div'),
      },
      { superScrollToEnd },
    )

    expect(didScroll).toBe(true)
    expect(superScrollToEnd).toHaveBeenCalledTimes(1)
  })

  it('returns false for super notes without superScrollToEnd', () => {
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
