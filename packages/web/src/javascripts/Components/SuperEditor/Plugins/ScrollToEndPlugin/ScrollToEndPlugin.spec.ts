/**
 * @jest-environment jsdom
 */

import type { LexicalEditor } from 'lexical'
import { createSuperScrollableEditor } from './ScrollToEndPlugin'

function setup() {
  const rootElement = document.createElement('div')
  Object.defineProperty(rootElement, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(rootElement, 'clientHeight', { value: 200, configurable: true })
  rootElement.scrollTop = 800

  const editor = {
    getRootElement: () => rootElement,
    update: jest.fn(),
    focus: jest.fn(),
  } as unknown as LexicalEditor

  return { editor, rootElement, scrollableEditor: createSuperScrollableEditor(editor) }
}

describe('createSuperScrollableEditor', () => {
  it('scrolls the root element to the bottom and focuses the editor', () => {
    const { editor, rootElement, scrollableEditor } = setup()

    scrollableEditor.scrollToEnd({ moveCaret: true })

    expect(scrollableEditor.getKeyboardTarget()).toBe(rootElement)
    expect(editor.update).toHaveBeenCalledTimes(1)
    expect(editor.focus).toHaveBeenCalledTimes(1)
  })

  it('only scrolls when the caret should not move', () => {
    const { editor, scrollableEditor } = setup()

    scrollableEditor.scrollToEnd({ moveCaret: false })

    expect(editor.update).not.toHaveBeenCalled()
    expect(editor.focus).not.toHaveBeenCalled()
  })
})
