import { SNNote } from '@standardnotes/models'
import { PreferenceServiceInterface } from '@standardnotes/snjs'
import { restorePlainEditorCaret } from './restorePlainEditorCaret'
import { isRestoreEditorPositionEnabled, shouldRestoreCaret } from './shouldRestoreCaret'
import { scrollPlainTextareaToOffset } from '../PlainEditor/search/scrollPlainTextareaToOffset'

jest.mock('./shouldRestoreCaret', () => ({ isRestoreEditorPositionEnabled: jest.fn(), shouldRestoreCaret: jest.fn() }))
jest.mock('../PlainEditor/search/scrollPlainTextareaToOffset', () => ({ scrollPlainTextareaToOffset: jest.fn() }))

describe('restorePlainEditorCaret', () => {
  const preferences = {} as PreferenceServiceInterface

  const restore = (lastCaretOffset: number, { enabled = true, shouldRestore = true } = {}) => {
    ;(isRestoreEditorPositionEnabled as jest.Mock).mockReturnValue(enabled)
    ;(shouldRestoreCaret as unknown as jest.Mock).mockReturnValue(shouldRestore)

    const textarea = document.createElement('textarea')
    textarea.value = 'hello'
    document.body.appendChild(textarea)

    restorePlainEditorCaret(textarea, { lastCaretOffset } as SNNote, preferences)

    return textarea
  }

  afterEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('focuses the editor and places the caret at the stored offset', () => {
    const textarea = restore(3)

    expect(document.activeElement).toBe(textarea)
    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([3, 3])
    expect(scrollPlainTextareaToOffset).toHaveBeenCalledWith(textarea, 3)
  })

  it('clamps an offset beyond the text length', () => {
    const textarea = restore(100)

    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([5, 5])
    expect(scrollPlainTextareaToOffset).toHaveBeenCalledWith(textarea, 5)
  })

  it('clamps a negative offset', () => {
    const textarea = restore(-4)

    expect([textarea.selectionStart, textarea.selectionEnd]).toEqual([0, 0])
  })

  it('still focuses the editor when there is no caret to restore', () => {
    const textarea = restore(3, { shouldRestore: false })

    expect(document.activeElement).toBe(textarea)
    expect(textarea.selectionStart).toBe(5)
    expect(scrollPlainTextareaToOffset).not.toHaveBeenCalled()
  })

  it('does nothing when the setting is disabled', () => {
    const textarea = restore(3, { enabled: false })

    expect(document.activeElement).not.toBe(textarea)
    expect(scrollPlainTextareaToOffset).not.toHaveBeenCalled()
  })
})
