import type { ComponentViewerInterface } from '@standardnotes/snjs'
import { $getRoot, LexicalEditor } from 'lexical'
import { scrollElementToBottom } from '@/Utils/scrollElementToBottom'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import { observeElementScrollState } from './scrollToBottomUtils'
import type { ScrollableEditor } from './types'

export function createPlainScrollableEditor(plainEditor: PlainEditorInterface): ScrollableEditor {
  return {
    observeScrollState: (callback) => {
      const textarea = plainEditor.getTextarea()
      if (!textarea) {
        return () => undefined
      }
      return observeElementScrollState(textarea, (onChange) => plainEditor.onTextChange(onChange), callback)
    },
    scrollToEnd: ({ moveCaret }) => {
      const textarea = plainEditor.getTextarea()
      if (!textarea) {
        return
      }

      scrollElementToBottom(textarea, () => {
        if (!moveCaret) {
          return
        }
        const textLength = textarea.value.length
        plainEditor.setSelection(textLength, textLength, { selectInEditor: true, focus: true, scrollIntoView: false })
      })
    },
    getKeyboardTarget: () => plainEditor.getTextarea(),
  }
}

export function createSuperScrollableEditor(editor: LexicalEditor): ScrollableEditor {
  return {
    observeScrollState: (callback) => {
      const rootElement = editor.getRootElement()
      if (!rootElement) {
        return () => undefined
      }
      return observeElementScrollState(
        rootElement,
        (onChange) => editor.registerUpdateListener(() => onChange()),
        callback,
      )
    },
    scrollToEnd: ({ moveCaret }) => {
      const rootElement = editor.getRootElement()
      if (!rootElement) {
        return
      }

      scrollElementToBottom(rootElement, () => {
        if (!moveCaret) {
          return
        }
        editor.update(() => {
          $getRoot().selectEnd()
        })
        editor.focus()
      })
    },
    getKeyboardTarget: () => editor.getRootElement(),
  }
}

/** The component scrolls itself; only components that report their scroll state get the button. */
export function createComponentScrollableEditor(componentViewer: ComponentViewerInterface): ScrollableEditor {
  return {
    observeScrollState: (callback) => componentViewer.addScrollStateObserver(callback),
    scrollToEnd: (options) => componentViewer.requestScrollToEnd(options),
    getKeyboardTarget: () =>
      document.querySelector<HTMLElement>(`[data-component-viewer-id="${componentViewer.identifier}"]`),
  }
}
