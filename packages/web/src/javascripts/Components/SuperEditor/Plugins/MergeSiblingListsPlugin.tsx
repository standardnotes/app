import { ListNode, $isListNode } from '@lexical/list'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'

function mergeListNodesTransform(node: ListNode) {
  const nextSibling = node.getNextSibling()

  if ($isListNode(nextSibling) && $isListNode(node) && nextSibling.getListType() === node.getListType()) {
    node.append(...nextSibling.getChildren())
    nextSibling.remove()
  }
}

// https://github.com/facebook/lexical/issues/4618
export function MergeSiblingListsPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(ListNode, mergeListNodesTransform)
  }, [editor])

  return null
}
