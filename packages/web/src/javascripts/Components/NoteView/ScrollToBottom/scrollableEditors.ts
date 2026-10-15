import { scrollElementToBottom } from '@/Utils/scrollElementToBottom'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import type { ScrollableEditor } from './types'

export function createPlainScrollableEditor(plainEditor: PlainEditorInterface): ScrollableEditor {
  return {
    getScrollElement: () => plainEditor.getTextarea(),
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
    onTextChange: (callback) => plainEditor.onTextChange(callback),
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
