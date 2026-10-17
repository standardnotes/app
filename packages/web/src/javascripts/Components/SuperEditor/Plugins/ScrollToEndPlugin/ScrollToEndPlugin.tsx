import { forwardRef, useImperativeHandle } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getRoot, LexicalEditor } from 'lexical'
import { scrollElementToBottom } from '@/Utils/scrollElementToBottom'
import { observeElementScrollState } from '@/Components/NoteView/ScrollToBottom/isScrolledToBottom'
import type { ScrollableEditor } from '@/Components/NoteView/ScrollToBottom/types'

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
        if (!moveCaret || !editor.isEditable()) {
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

const ScrollToEndPlugin = forwardRef<ScrollableEditor>(function ScrollToEndPlugin(_props, ref) {
  const [editor] = useLexicalComposerContext()

  useImperativeHandle(ref, () => createSuperScrollableEditor(editor), [editor])

  return null
})

export default ScrollToEndPlugin
