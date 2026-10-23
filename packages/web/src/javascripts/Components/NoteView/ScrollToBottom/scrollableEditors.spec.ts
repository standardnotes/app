/**
 * @jest-environment jsdom
 */

import type { ComponentViewerInterface } from '@standardnotes/snjs'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import type { LexicalEditor } from 'lexical'
import {
  createComponentScrollableEditor,
  createPlainScrollableEditor,
  createSuperScrollableEditor,
} from './scrollableEditors'

function createElementScrolledToBottom<T extends HTMLElement>(element: T): T {
  Object.defineProperty(element, 'scrollHeight', { value: 1000, configurable: true })
  Object.defineProperty(element, 'clientHeight', { value: 200, configurable: true })
  element.scrollTop = 800
  return element
}

describe('createPlainScrollableEditor', () => {
  function setup() {
    const textarea = createElementScrolledToBottom(document.createElement('textarea'))
    textarea.value = 'hello world'

    const setSelection = jest.fn()
    const plainEditor = { getTextarea: () => textarea, setSelection } as unknown as PlainEditorInterface

    return { scrollableEditor: createPlainScrollableEditor(plainEditor), setSelection }
  }

  it('scrolls the textarea to the bottom and places the caret at the end', () => {
    const { scrollableEditor, setSelection } = setup()

    scrollableEditor.scrollToEnd({ moveCaret: true })

    expect(setSelection).toHaveBeenCalledWith(11, 11, { selectInEditor: true, focus: true, scrollIntoView: false })
  })

  it('only scrolls when the caret should not move', () => {
    const { scrollableEditor, setSelection } = setup()

    scrollableEditor.scrollToEnd({ moveCaret: false })

    expect(setSelection).not.toHaveBeenCalled()
  })
})

describe('createComponentScrollableEditor', () => {
  it('delegates scroll state and scrolling to the component viewer', () => {
    const dispose = jest.fn()
    const componentViewer = {
      identifier: 'viewer-id',
      addScrollStateObserver: jest.fn().mockReturnValue(dispose),
      requestScrollToEnd: jest.fn(),
    } as unknown as ComponentViewerInterface
    const iframe = document.createElement('iframe')
    iframe.dataset.componentViewerId = 'viewer-id'
    document.body.appendChild(iframe)
    const callback = jest.fn()

    const scrollableEditor = createComponentScrollableEditor(componentViewer)

    expect(scrollableEditor.observeScrollState(callback)).toBe(dispose)
    expect(componentViewer.addScrollStateObserver).toHaveBeenCalledWith(callback)

    scrollableEditor.scrollToEnd({ moveCaret: true })
    expect(componentViewer.requestScrollToEnd).toHaveBeenCalledWith({ moveCaret: true })

    expect(scrollableEditor.getKeyboardTarget()).toBe(iframe)
    iframe.remove()
  })
})

function setupSuper() {
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
    const { editor, rootElement, scrollableEditor } = setupSuper()

    scrollableEditor.scrollToEnd({ moveCaret: true })

    expect(scrollableEditor.getKeyboardTarget()).toBe(rootElement)
    expect(editor.update).toHaveBeenCalledTimes(1)
    expect(editor.focus).toHaveBeenCalledTimes(1)
  })

  it('only scrolls when the caret should not move', () => {
    const { editor, scrollableEditor } = setupSuper()

    scrollableEditor.scrollToEnd({ moveCaret: false })

    expect(editor.update).not.toHaveBeenCalled()
    expect(editor.focus).not.toHaveBeenCalled()
  })
})
