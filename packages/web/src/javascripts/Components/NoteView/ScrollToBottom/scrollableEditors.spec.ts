/**
 * @jest-environment jsdom
 */

import type { ComponentViewerInterface } from '@standardnotes/snjs'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import { createComponentScrollableEditor, createPlainScrollableEditor } from './scrollableEditors'

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
      addScrollStateObserver: jest.fn().mockReturnValue(dispose),
      requestScrollToEnd: jest.fn(),
    } as unknown as ComponentViewerInterface
    const callback = jest.fn()

    const scrollableEditor = createComponentScrollableEditor(componentViewer)

    expect(scrollableEditor.observeScrollState(callback)).toBe(dispose)
    expect(componentViewer.addScrollStateObserver).toHaveBeenCalledWith(callback)

    scrollableEditor.scrollToEnd({ moveCaret: true })
    expect(componentViewer.requestScrollToEnd).toHaveBeenCalledWith({ moveCaret: true })

    expect(scrollableEditor.getKeyboardTarget).toBeUndefined()
  })
})
