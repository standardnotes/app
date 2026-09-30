/**
 * @jest-environment jsdom
 */

import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import { isScrolledToBottom } from './isScrolledToBottom'
import { scrollPlainEditorToBottom } from './scrollPlainEditorToBottom'

describe('scrollPlainEditorToBottom', () => {
  it('moves the caret to the end and scrolls the textarea to the bottom', () => {
    const textarea = document.createElement('textarea')
    const lines = Array.from({ length: 40 }, (_, index) => `line ${index}`).join('\n')
    textarea.value = lines
    textarea.style.width = '200px'
    textarea.style.height = '80px'
    textarea.style.lineHeight = '20px'
    document.body.appendChild(textarea)

    const plainEditor: Pick<PlainEditorInterface, 'getTextarea' | 'getText'> = {
      getTextarea: () => textarea,
      getText: () => textarea.value,
    }

    const didScroll = scrollPlainEditorToBottom(plainEditor as PlainEditorInterface)

    expect(didScroll).toBe(true)
    expect(textarea.selectionStart).toBe(lines.length)
    expect(textarea.selectionEnd).toBe(lines.length)
    expect(isScrolledToBottom(textarea)).toBe(true)

    document.body.removeChild(textarea)
  })

  it('returns false for a readonly textarea', () => {
    const textarea = document.createElement('textarea')
    textarea.readOnly = true
    textarea.value = 'hello'

    const plainEditor: Pick<PlainEditorInterface, 'getTextarea' | 'getText'> = {
      getTextarea: () => textarea,
      getText: () => textarea.value,
    }

    expect(scrollPlainEditorToBottom(plainEditor as PlainEditorInterface)).toBe(false)
  })
})
