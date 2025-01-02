import { $createParagraphNode, $getRoot, $insertNodes, LexicalNode } from 'lexical'
import { $generateNodesFromDOM } from '@lexical/html'
import { createHeadlessEditor } from '@lexical/headless'
import { BlockEditorNodes } from '../SuperEditor/Lexical/Nodes/AllNodes'
import BlocksEditorTheme from '../SuperEditor/Lexical/Theme/Theme'
import { ClipPayload } from '@standardnotes/clipper/src/types/message'
import { $isLinkNode } from '@lexical/link'
import { $dfs } from '@lexical/utils'

const AbsoluteLinkRegExp = new RegExp('^(?:[a-z+]+:)?//', 'i')

export const getSuperJSONFromClipPayload = async (clipPayload: ClipPayload) => {
  const editor = createHeadlessEditor({
    namespace: 'BlocksEditor',
    theme: BlocksEditorTheme,
    editable: false,
    onError: (error: Error) => console.error(error),
    nodes: [...BlockEditorNodes],
  })

  const clipURL = new URL(clipPayload.url)

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

      if (typeof clipPayload.content !== 'string') {
        throw new Error('Clip payload content is not a string')
      }

      const dom = parser.parseFromString(clipPayload.content, 'text/html')
      const generatedNodes = $generateNodesFromDOM(editor, dom)
      const nodesToInsert: LexicalNode[] = []
      generatedNodes.forEach((node) => {
        const type = node.getType()

        // Wrap text & link nodes with paragraph since they can't
        // be top-level nodes in Super
        if (type === 'text' || type === 'link') {
          const paragraphNode = $createParagraphNode()
          paragraphNode.append(node)
          nodesToInsert.push(paragraphNode)
          return
        } else {
          nodesToInsert.push(node)
        }

        nodesToInsert.push($createParagraphNode())
      })
      $getRoot().selectEnd()
      $insertNodes(nodesToInsert.concat($createParagraphNode()))

      resolve()
    })
  })

  await new Promise<void>((resolve) => {
    editor.update(() => {
      for (const { node } of $dfs()) {
        if (!$isLinkNode(node)) {
          continue
        }
        const url = node.getURL()
        const isAbsoluteLink = AbsoluteLinkRegExp.test(url)

        if (!isAbsoluteLink) {
          const fixedURL = new URL(url, clipURL)
          node.setURL(fixedURL.toString())
        }
      }

      resolve()
    })
  })

  return JSON.stringify(editor.getEditorState().toJSON())
}
