/**
 * @jest-environment jsdom
 */

import { getTargetScrollTopForMatch, scrollPlainTextareaToOffset } from './scrollPlainTextareaToOffset'

describe('scrollPlainTextareaToOffset', () => {
  it('centers the match in the textarea viewport', () => {
    const textarea = document.createElement('textarea')
    const lines = Array.from({ length: 20 }, (_, index) => `line ${index}`).join('\n')
    textarea.value = lines
    textarea.style.width = '200px'
    textarea.style.height = '80px'
    textarea.style.lineHeight = '20px'
    textarea.style.padding = '0'
    textarea.style.whiteSpace = 'pre-wrap'
    document.body.appendChild(textarea)

    const matchStart = lines.indexOf('line 15')
    const matchEnd = matchStart + 'line 15'.length
    const targetScrollTop = getTargetScrollTopForMatch(textarea, matchStart, matchEnd)

    scrollPlainTextareaToOffset(textarea, matchStart, matchEnd)

    expect(textarea.scrollTop).toBe(targetScrollTop)

    document.body.removeChild(textarea)
  })

  it('clamps offsets to the textarea value length', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'hello'
    document.body.appendChild(textarea)

    expect(() => scrollPlainTextareaToOffset(textarea, 0, 100)).not.toThrow()

    document.body.removeChild(textarea)
  })
})
