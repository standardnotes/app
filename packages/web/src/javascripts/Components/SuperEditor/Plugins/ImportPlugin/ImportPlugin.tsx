import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown'
import { $createParagraphNode, $createRangeSelection, $insertNodes, $isTextNode, LexicalNode, TextNode } from 'lexical'
import { handleEditorChange } from '../../Utils'
import { SuperNotePreviewCharLimit } from '../../SuperEditor'
import { $generateNodesFromDOM } from '../../Lexical/Utils/generateNodesFromDOM'

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
        // const nodesToInsert: LexicalNode[] = []
        const nodesToInsert = $generateNodesFromDOM(editor, dom)
        nodesToInsert.forEach((node) => console.log(node, node.getTextContent(), node instanceof TextNode))
        // for (const node of generatedNodes) {
        //   if ($isTextNode(node)) {
        //     // Wrap text nodes with paragraphNode since they can't be
        //     // direct children of the root
        //     const paragraphNode = $createParagraphNode()
        //     paragraphNode.append(node)
        //     nodesToInsert.unshift(paragraphNode)
        //   } else {
        //     nodesToInsert.unshift(node)
        //   }
        // }
        // const selection = $createRangeSelection()
        // const newLineNode = $createParagraphNode()
        // selection.insertNodes([newLineNode, ...nodesToInsert])
        $insertNodes(nodesToInsert)
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
