import { $createParagraphNode, $getRoot, $insertNodes } from 'lexical'
import { $generateNodesFromDOM } from '../SuperEditor/Lexical/Utils/generateNodesFromDOM'
import { createHeadlessEditor } from '@lexical/headless'
import { BlockEditorNodes } from '../SuperEditor/Lexical/Nodes/AllNodes'
import BlocksEditorTheme from '../SuperEditor/Lexical/Theme/Theme'

export const getSuperJSONFromClipHTML = async (html: string) => {
  const editor = createHeadlessEditor({
    namespace: 'BlocksEditor',
    theme: BlocksEditorTheme,
    editable: false,
    onError: (error: Error) => console.error(error),
    nodes: [...BlockEditorNodes],
  })

  await new Promise<void>((resolve) => {
    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(html, 'text/html')
      const nodesToInsert = $generateNodesFromDOM(editor, dom).map((node) => {
        const type = node.getType()

        // Wrap text & link nodes with paragraph since they can't
        // be top-level nodes in Super
        if (type === 'text' || type === 'link') {
          const paragraphNode = $createParagraphNode()
          paragraphNode.append(node)
          return paragraphNode
        }

        return node
      })
      $getRoot().select()
      $insertNodes(nodesToInsert)
      const paragraphNode = $createParagraphNode()
      $getRoot().selectEnd()
      $insertNodes([paragraphNode])
      resolve()
    })
  })

  return JSON.stringify(editor.getEditorState().toJSON())
}
