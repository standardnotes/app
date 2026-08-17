/**
 * @jest-environment jsdom
 */

import { PlainEditorInterface } from '../../PlainEditor/PlainEditor'
import { createPlainEditorUniversalSearchProvider } from './PlainEditorUniversalSearchProvider'

function createMockPlainEditor(text: string): PlainEditorInterface {
  let currentText = text
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setSelectionRange(0, 0)

  return {
    focus: jest.fn(),
    getText: () => currentText,
    getTextarea: () => textarea,
    setSelection: jest.fn((start, end, options) => {
      if (options?.selectInEditor) {
        textarea.setSelectionRange(start, end)
      }
    }),
    replaceRange: jest.fn(async (start, end, replacement) => {
      currentText = currentText.slice(0, start) + replacement + currentText.slice(end)
      textarea.value = currentText
    }),
    replaceAllRanges: jest.fn(async (ranges, replacement) => {
      const sortedRanges = [...ranges].sort((a, b) => b.start - a.start)
      for (const { start, end } of sortedRanges) {
        currentText = currentText.slice(0, start) + replacement + currentText.slice(end)
      }
      textarea.value = currentText
    }),
    onTextChange: () => {
      return () => {
        return
      }
    },
  }
}

describe('PlainEditorUniversalSearchProvider', () => {
  it('finds matches with optional case sensitivity', async () => {
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => createMockPlainEditor('Hello hello'),
    })

    expect(await provider.search({ query: 'hello', isCaseSensitive: true })).toHaveLength(1)
    expect(await provider.search({ query: 'hello', isCaseSensitive: false })).toHaveLength(2)
  })

  it('supports replace and highlight all capabilities', () => {
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => createMockPlainEditor('hello'),
    })

    expect(provider.capabilities.supportsReplace).toBe(true)
    expect(provider.capabilities.supportsHighlightAll).toBe(true)
  })

  it('scrolls to a result without selecting it during search navigation', async () => {
    const editor = createMockPlainEditor('hello world')
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => editor,
    })
    const [result] = await provider.search({ query: 'world', isCaseSensitive: false })

    provider.selectResult(result, { scrollIntoView: true })

    expect(editor.setSelection).toHaveBeenCalledWith(6, 11, {
      focus: false,
      scrollIntoView: true,
      selectInEditor: false,
    })
    expect(editor.getTextarea()?.selectionStart).toBe(0)
    expect(editor.getTextarea()?.selectionEnd).toBe(0)
  })

  it('selects a result in the editor when requested', async () => {
    const editor = createMockPlainEditor('hello world')
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => editor,
    })
    const [result] = await provider.search({ query: 'world', isCaseSensitive: false })

    provider.selectResult(result, { selectInEditor: true })

    expect(editor.getTextarea()?.selectionStart).toBe(6)
    expect(editor.getTextarea()?.selectionEnd).toBe(11)
  })

  it('replaces the current and all results', async () => {
    const editor = createMockPlainEditor('hello hello')
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => editor,
    })
    const results = await provider.search({ query: 'hello', isCaseSensitive: false })

    await provider.replaceCurrentResult?.(results[0], {
      query: 'hello',
      isCaseSensitive: false,
      replaceQuery: 'goodbye',
    })

    expect(editor.getText()).toBe('goodbye hello')
    expect(editor.replaceRange).toHaveBeenCalledTimes(1)

    const remainingResults = await provider.search({ query: 'hello', isCaseSensitive: false })
    await provider.replaceAllResults?.(remainingResults, {
      query: 'hello',
      isCaseSensitive: false,
      replaceQuery: 'bye',
    })

    expect(editor.getText()).toBe('goodbye bye')
    expect(editor.replaceAllRanges).toHaveBeenCalledTimes(1)
    expect(editor.replaceRange).toHaveBeenCalledTimes(1)
  })
})
