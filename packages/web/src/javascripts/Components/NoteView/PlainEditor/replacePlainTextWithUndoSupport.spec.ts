/**
 * @jest-environment jsdom
 */

import { replaceAllTextRangesWithUndoSupport } from './replacePlainTextWithUndoSupport'

describe('replaceAllTextRangesWithUndoSupport', () => {
  beforeEach(() => {
    document.queryCommandSupported = jest.fn(() => true)
    document.execCommand = jest.fn(() => true)
  })

  it('replaces all matches in a single insertText operation', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'hello hello'
    const replaceInput = document.createElement('input')
    document.body.appendChild(textarea)
    document.body.appendChild(replaceInput)
    replaceInput.focus()

    document.execCommand = jest.fn((_command, _showUi, text: string) => {
      textarea.value = text
      return true
    })

    const result = replaceAllTextRangesWithUndoSupport(
      textarea,
      [
        { start: 0, end: 5 },
        { start: 6, end: 11 },
      ],
      'bye',
    )

    expect(result).toBe('bye bye')
    expect(document.execCommand).toHaveBeenCalledTimes(1)
    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'bye bye')
    expect(document.activeElement).toBe(replaceInput)
  })
})
