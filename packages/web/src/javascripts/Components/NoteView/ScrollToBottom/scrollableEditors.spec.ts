/**
 * @jest-environment jsdom
 */

import type { LexicalEditor } from 'lexical'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import { createPlainScrollableEditor, createSuperScrollableEditor } from './scrollableEditors'

function createElementScrolledToBottom<T extends HTMLElement>(element: T): T {
  Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })
  element.scrollTop = 800
  return element
}

describe('createPlainScrollableEditor', () => {
  it('scrolls the textarea to the bottom and places the caret at the end', () => {
    const textarea = createElementScrolledToBottom(document.createElement('textarea'))
    textarea.value = 'hello world'

    const setSelection = jest.fn()
    const plainEditor = { getTextarea: () => textarea, setSelection } as unknown as PlainEditorInterface

    createPlainScrollableEditor(plainEditor).scrollToEnd()

    expect(setSelection).toHaveBeenCalledWith(11, 11, { selectInEditor: true, focus: true, scrollIntoView: false })
  })
})

describe('createSuperScrollableEditor', () => {
  it('scrolls the root element to the bottom and focuses the editor', () => {
    const rootElement = createElementScrolledToBottom(document.createElement('div'))
    const editor = {
      getRootElement: () => rootElement,
      update: jest.fn(),
      focus: jest.fn(),
    } as unknown as LexicalEditor

    const scrollableEditor = createSuperScrollableEditor(editor)
    scrollableEditor.scrollToEnd()

    expect(scrollableEditor.getScrollElement()).toBe(rootElement)
    expect(editor.update).toHaveBeenCalledTimes(1)
    expect(editor.focus).toHaveBeenCalledTimes(1)
  })
})
