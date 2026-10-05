import { forwardRef, useImperativeHandle } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createSuperScrollableEditor } from '@/Components/NoteView/ScrollToBottom/scrollableEditors'
import type { ScrollableEditor } from '@/Components/NoteView/ScrollToBottom/types'

const ScrollToEndPlugin = forwardRef<ScrollableEditor>(function ScrollToEndPlugin(_props, ref) {
  const [editor] = useLexicalComposerContext()

  useImperativeHandle(ref, () => createSuperScrollableEditor(editor), [editor])

  return null
})

export default ScrollToEndPlugin
