import { forwardRef, useImperativeHandle } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { LexicalEditor } from 'lexical'

const EditorRefPlugin = forwardRef<LexicalEditor>(function EditorRefPlugin(_props, ref) {
  const [editor] = useLexicalComposerContext()

  useImperativeHandle(ref, () => editor, [editor])

  return null
})

export default EditorRefPlugin
