/**
 * @jest-environment jsdom
 */

import { isHighlightSpanElement, isHighlightSpanStyle } from './HighlightSpanImport'

describe('HighlightSpanImport', () => {
  it('detects --en-highlight in style attribute', () => {
    expect(isHighlightSpanStyle('--en-highlight:yellow;background-color: #ffef9e;')).toBe(true)
  })

  it('detects -evernote-highlight in style attribute', () => {
    expect(isHighlightSpanStyle('background-color: rgb(255, 250, 165);-evernote-highlight:true;')).toBe(true)
  })

  it('does not treat highlight:false as highlighted', () => {
    expect(isHighlightSpanStyle('--en-highlight:false;')).toBe(false)
  })

  it('detects highlight spans by element style', () => {
    const span = document.createElement('span')
    span.setAttribute('style', '--en-highlight:yellow;background-color: #ffef9e;')

    expect(isHighlightSpanElement(span)).toBe(true)
  })
})
