/**
 * @jest-environment jsdom
 */

import { PlainEditorInterface } from '../../PlainEditor/PlainEditor'
import { createPlainEditorUniversalSearchProvider } from './PlainEditorUniversalSearchProvider'

function createMockPlainEditor(text: string, locked = false): PlainEditorInterface {
  let currentText = text
  const textarea = document.createElement('textarea')
  textarea.value = text

  return {
    focus: jest.fn(),
    getText: () => currentText,
    getTextarea: () => textarea,
    setSelection: (start, end) => {
      textarea.setSelectionRange(start, end)
    },
    replaceRange: jest.fn(async (start, end, replacement) => {
      if (locked) {
        return
      }

      currentText = currentText.slice(0, start) + replacement + currentText.slice(end)
      textarea.value = currentText
    }),
    replaceAllRanges: jest.fn(async (ranges, replacement) => {
      if (locked) {
        return
      }

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
      getLocked: () => false,
    })

    expect(await provider.search({ query: 'hello', isCaseSensitive: true })).toHaveLength(1)
    expect(await provider.search({ query: 'hello', isCaseSensitive: false })).toHaveLength(2)
  })

  it('supports highlight all capability', () => {
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => createMockPlainEditor('hello'),
      getLocked: () => false,
    })

    expect(provider.capabilities.supportsHighlightAll).toBe(true)
  })

  it('selects a result in the textarea', async () => {
    const editor = createMockPlainEditor('hello world')
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => editor,
      getLocked: () => false,
    })
    const [result] = await provider.search({ query: 'world', isCaseSensitive: false })

    provider.selectResult(result)

    expect(editor.getTextarea()?.selectionStart).toBe(6)
    expect(editor.getTextarea()?.selectionEnd).toBe(11)
  })

  it('replaces the current and all results', async () => {
    const editor = createMockPlainEditor('hello hello')
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => editor,
      getLocked: () => false,
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

  it('disables replace when the editor is locked', () => {
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => createMockPlainEditor('hello', true),
      getLocked: () => true,
    })

    expect(provider.capabilities.supportsReplace).toBe(false)
  })

  it('reflects locked changes lazily without rebuilding the provider', () => {
    let locked = false
    const provider = createPlainEditorUniversalSearchProvider({
      getEditor: () => createMockPlainEditor('hello'),
      getLocked: () => locked,
    })

    expect(provider.capabilities.supportsReplace).toBe(true)

    locked = true

    expect(provider.capabilities.supportsReplace).toBe(false)
  })
})
