import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { $generateNodesFromDOM } from '@lexical/html'
import { $createParagraphNode, $createRangeSelection } from 'lexical'
import { handleEditorChange } from '@standardnotes/blocks-editor/src/Editor/Utils'
import { SuperNotePreviewCharLimit } from '../../SuperEditor'

/** Note that markdown conversion does not insert new lines. See: https://github.com/facebook/lexical/issues/2815 */
export default function ImportPlugin({
  text,
  format,
  onChange,
}: {
  text: string
  format: 'md' | 'html'
  onChange: (value: string, preview: string) => void
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const dontAllowConversionOfEmptyStringWhichWouldResultInError = text.length === 0
    if (dontAllowConversionOfEmptyStringWhichWouldResultInError) {
      return
    }

    editor.update(() => {
      if (format === 'md') {
        $convertFromMarkdownString(text, [...TRANSFORMERS])
      } else {
        const parser = new DOMParser()
        const dom = parser.parseFromString(text, 'text/html')
        const nodes = $generateNodesFromDOM(editor, dom)
        const selection = $createRangeSelection()
        const newLineNode = $createParagraphNode()
        selection.insertNodes([newLineNode, ...nodes])
      }
    })
  }, [editor, text, format])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        handleEditorChange(editorState, SuperNotePreviewCharLimit, onChange)
      })
    })
  }, [editor, onChange])

  return null
}
