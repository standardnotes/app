/**
 * @jest-environment jsdom
 */

import {
  replaceAllTextRangesWithUndoSupport,
  replaceTextRangeWithUndoSupport,
} from './replacePlainTextWithUndoSupport'

describe('replacePlainTextWithUndoSupport', () => {
  beforeEach(() => {
    document.queryCommandSupported = jest.fn(() => true)
    document.execCommand = jest.fn(() => true)
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('replaces text and keeps focus on the replace input', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'hello world'
    const replaceInput = document.createElement('input')
    document.body.appendChild(textarea)
    document.body.appendChild(replaceInput)
    replaceInput.focus()

    document.execCommand = jest.fn((_command, _showUi, text: string) => {
      const start = textarea.selectionStart ?? 0
      const end = textarea.selectionEnd ?? 0
      textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end)
      return true
    })

    replaceTextRangeWithUndoSupport(textarea, 6, 11, 'earth')

    expect(textarea.value).toBe('hello earth')
    expect(textarea.selectionStart).toBe(0)
    expect(textarea.selectionEnd).toBe(0)
    expect(document.activeElement).toBe(replaceInput)
  })

  it('replaces all matches in one insertText operation', () => {
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
    expect(document.execCommand).toHaveBeenCalledWith('insertText', false, 'bye bye')
    expect(document.activeElement).toBe(replaceInput)
  })

  it('clears editor selection and restores replace input focus after undo', () => {
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

    replaceAllTextRangesWithUndoSupport(
      textarea,
      [
        { start: 0, end: 5 },
        { start: 6, end: 11 },
      ],
      'bye',
    )

    textarea.focus()
    textarea.value = 'hello hello'
    textarea.setSelectionRange(0, textarea.value.length)
    textarea.dispatchEvent(new InputEvent('input', { inputType: 'historyUndo', bubbles: true }))

    expect(textarea.selectionStart).toBe(0)
    expect(textarea.selectionEnd).toBe(0)
    expect(document.activeElement).toBe(replaceInput)
  })

  it('clears editor selection and restores replace input focus after undoing a single replace', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'hello world'
    const replaceInput = document.createElement('input')
    document.body.appendChild(textarea)
    document.body.appendChild(replaceInput)
    replaceInput.focus()

    document.execCommand = jest.fn((_command, _showUi, text: string) => {
      const start = textarea.selectionStart ?? 0
      const end = textarea.selectionEnd ?? 0
      textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end)
      return true
    })

    replaceTextRangeWithUndoSupport(textarea, 6, 11, 'earth')

    textarea.focus()
    textarea.value = 'hello world'
    textarea.setSelectionRange(6, 11)
    textarea.dispatchEvent(new InputEvent('input', { inputType: 'historyUndo', bubbles: true }))

    expect(textarea.selectionStart).toBe(0)
    expect(textarea.selectionEnd).toBe(0)
    expect(document.activeElement).toBe(replaceInput)
  })

  it('falls back to manual replacement when execCommand fails', () => {
    const textarea = document.createElement('textarea')
    textarea.value = 'hello world'
    const replaceInput = document.createElement('input')
    document.body.appendChild(textarea)
    document.body.appendChild(replaceInput)
    replaceInput.focus()

    document.execCommand = jest.fn(() => false)

    replaceTextRangeWithUndoSupport(textarea, 6, 11, 'earth')

    expect(textarea.value).toBe('hello earth')
    expect(textarea.selectionStart).toBe(0)
    expect(textarea.selectionEnd).toBe(0)
    expect(document.activeElement).toBe(replaceInput)

    textarea.focus()
    textarea.value = 'hello world'
    textarea.setSelectionRange(6, 11)
    textarea.dispatchEvent(new InputEvent('input', { inputType: 'historyUndo', bubbles: true }))

    expect(textarea.selectionStart).toBe(6)
    expect(textarea.selectionEnd).toBe(11)
    expect(document.activeElement).toBe(textarea)
  })
})
