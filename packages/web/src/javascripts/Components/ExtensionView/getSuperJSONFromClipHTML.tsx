import { $createParagraphNode, $getRoot, $insertNodes } from 'lexical'
import { $generateNodesFromDOM } from '../SuperEditor/Lexical/Utils/generateNodesFromDOM'
import { createHeadlessEditor } from '@lexical/headless'
import { BlockEditorNodes } from '../SuperEditor/Lexical/Nodes/AllNodes'
import BlocksEditorTheme from '../SuperEditor/Lexical/Theme/Theme'
import { ClipPayload } from '@standardnotes/extension/src/types/message'

export const getSuperJSONFromClipPayload = async (clipPayload: ClipPayload) => {
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

      const clipSourceDOM = parser.parseFromString(
        `<p>Clip source: <a href="${clipPayload.url}">${clipPayload.url}</a></p>`,
        'text/html',
      )
      const clipSourceParagraphNode = $generateNodesFromDOM(editor, clipSourceDOM).concat(
        $createParagraphNode(),
        $createParagraphNode(),
      )
      $getRoot().select()
      $insertNodes(clipSourceParagraphNode)

      const dom = parser.parseFromString(clipPayload.content, 'text/html')
      const nodesToInsert = $generateNodesFromDOM(editor, dom)
        .map((node) => {
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
        .concat($createParagraphNode())
      $getRoot().selectEnd()
      $insertNodes(nodesToInsert)

      resolve()
    })
  })

  return JSON.stringify(editor.getEditorState().toJSON())
}
