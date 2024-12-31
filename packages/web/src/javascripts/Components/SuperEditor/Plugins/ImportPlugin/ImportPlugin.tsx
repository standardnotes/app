import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $createParagraphNode, $createRangeSelection, LexicalEditor } from 'lexical'
import { handleEditorChange } from '../../Utils'
import { SuperNotePreviewCharLimit } from '../../SuperEditor'
import { $generateNodesFromDOM } from '@lexical/html'
import { MarkdownTransformers } from '../../MarkdownTransformers'
import { $convertFromMarkdownString } from '@lexical/markdown'

/** Note that markdown conversion does not insert new lines. See: https://github.com/facebook/lexical/issues/2815 */
export default function ImportPlugin({
  text,
  format,
  onChange,
  customImportFunction,
}: {
  text: string
  format: 'md' | 'html'
  onChange: (value: string, preview: string) => void
  customImportFunction?: (editor: LexicalEditor, text: string) => void
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const dontAllowConversionOfEmptyStringWhichWouldResultInError = text.trim().length === 0
    if (dontAllowConversionOfEmptyStringWhichWouldResultInError) {
      return
    }

    if (customImportFunction) {
      customImportFunction(editor, text)
      return
    }

    editor.update(() => {
      if (format === 'md') {
        $convertFromMarkdownString(text, MarkdownTransformers, undefined, true)
      } else {
        const parser = new DOMParser()
        const dom = parser.parseFromString(text, 'text/html')
        const nodesToInsert = $generateNodesFromDOM(editor, dom)
        const selection = $createRangeSelection()
        const newLineNode = $createParagraphNode()
        selection.insertNodes([newLineNode, ...nodesToInsert])
      }
    })
  }, [editor, text, format, customImportFunction])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        handleEditorChange(editorState, SuperNotePreviewCharLimit, onChange)
      })
    })
  }, [editor, onChange])

  return null
}
