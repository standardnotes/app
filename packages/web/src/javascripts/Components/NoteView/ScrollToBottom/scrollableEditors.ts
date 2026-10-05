import { $getRoot, LexicalEditor } from 'lexical'
import { scrollElementToBottom } from '@/Utils/scrollElementToBottom'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import type { ScrollableEditor } from './types'

export function createPlainScrollableEditor(plainEditor: PlainEditorInterface): ScrollableEditor {
  return {
    getScrollElement: () => plainEditor.getTextarea(),
    scrollToEnd: () => {
      const textarea = plainEditor.getTextarea()
      if (!textarea) {
        return
      }

      scrollElementToBottom(textarea, () => {
        const textLength = textarea.value.length
        plainEditor.setSelection(textLength, textLength, { selectInEditor: true, focus: true, scrollIntoView: false })
      })
    },
    onTextChange: (callback) => plainEditor.onTextChange(callback),
  }
}

export function createSuperScrollableEditor(editor: LexicalEditor): ScrollableEditor {
  return {
    getScrollElement: () => editor.getRootElement(),
    scrollToEnd: () => {
      const rootElement = editor.getRootElement()
      if (!rootElement) {
        return
      }

      scrollElementToBottom(rootElement, () => {
        editor.update(() => {
          $getRoot().selectEnd()
        })
        editor.focus()
      })
    },
    onTextChange: (callback) => editor.registerUpdateListener(() => callback()),
  }
}

export function createComponentScrollableEditor(getEditorContentElement: () => HTMLElement | null): ScrollableEditor {
  return {
    getScrollElement: getEditorContentElement,
    scrollToEnd: () => {
      const editorContentElement = getEditorContentElement()
      if (!editorContentElement) {
        return
      }

      scrollElementToBottom(editorContentElement)

      const iframe = editorContentElement.querySelector('iframe')
      iframe?.contentWindow?.focus()

      try {
        iframe?.contentDocument?.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'End',
            ctrlKey: true,
            bubbles: true,
          }),
        )
      } catch {
        // Cross-origin iframe: host scroll only.
      }
    },
    onTextChange: () => () => undefined,
  }
}
