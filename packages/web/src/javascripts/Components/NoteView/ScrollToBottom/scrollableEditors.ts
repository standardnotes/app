import type { ComponentViewerInterface } from '@standardnotes/snjs'
import { scrollElementToBottom } from '@/Utils/scrollElementToBottom'
import type { PlainEditorInterface } from '../PlainEditor/PlainEditor'
import { observeElementScrollState } from './isScrolledToBottom'
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

/** The component scrolls itself; only components that report their scroll state get the button. */
export function createComponentScrollableEditor(componentViewer: ComponentViewerInterface): ScrollableEditor {
  return {
    observeScrollState: (callback) => componentViewer.addScrollStateObserver(callback),
    scrollToEnd: (options) => componentViewer.requestScrollToEnd(options),
  }
}
