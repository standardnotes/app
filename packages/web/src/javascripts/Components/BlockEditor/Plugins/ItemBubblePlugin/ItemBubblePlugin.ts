import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement } from '@lexical/utils'
import { COMMAND_PRIORITY_EDITOR, $createParagraphNode, $insertNodes, $isRootOrShadowRoot } from 'lexical'
import { useEffect } from 'react'
import { INSERT_BUBBLE_COMMAND } from '../Commands'
import { BubbleNode } from './Nodes/BubbleNode'
import { $createBubbleNode } from './Nodes/BubbleUtils'

export default function ItemBubblePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([BubbleNode])) {
      throw new Error('ItemBubblePlugin: BubbleNode not registered on editor')
    }

    return editor.registerCommand<string>(
      INSERT_BUBBLE_COMMAND,
      (payload) => {
        const bubbleNode = $createBubbleNode(payload)
        $insertNodes([bubbleNode])
        if ($isRootOrShadowRoot(bubbleNode.getParentOrThrow())) {
          $wrapNodeInElement(bubbleNode, $createParagraphNode).selectEnd()
        }

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
