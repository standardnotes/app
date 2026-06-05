/**
 * @jest-environment jsdom
 */

import {
  convertEvernoteHighlightSpansToMarks,
  isEvernoteHighlightElement,
  isEvernoteHighlightStyle,
} from './EvernoteHighlight'

describe('EvernoteHighlight', () => {
  it('detects --en-highlight in style attribute', () => {
    expect(isEvernoteHighlightStyle('--en-highlight:yellow;background-color: #ffef9e;')).toBe(true)
  })

  it('detects -evernote-highlight in style attribute', () => {
    expect(isEvernoteHighlightStyle('background-color: rgb(255, 250, 165);-evernote-highlight:true;')).toBe(true)
  })

  it('does not treat highlight:false as highlighted', () => {
    expect(isEvernoteHighlightStyle('--en-highlight:false;')).toBe(false)
  })

  it('converts highlight spans to mark elements', () => {
    const root = document.createElement('div')
    root.innerHTML =
      '<span style="--en-highlight:yellow;background-color: #ffef9e;">Line 2</span><span>plain</span>'

    convertEvernoteHighlightSpansToMarks(root)

    expect(root.querySelector('span')).not.toBeNull()
    expect(root.querySelector('mark')?.textContent).toBe('Line 2')
    expect(isEvernoteHighlightElement(root.querySelector('mark') as HTMLElement)).toBe(true)
  })
})
