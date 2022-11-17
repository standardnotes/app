import type { DOMConversionOutput, LexicalNode } from 'lexical'

import { BubbleNode } from './BubbleNode'

export function convertToBubbleElement(domNode: HTMLDivElement): DOMConversionOutput | null {
  const itemUuid = domNode.getAttribute('data-lexical-item-uuid')
  if (itemUuid) {
    const node = $createBubbleNode(itemUuid)
    return { node }
  }
  return null
}

export function $createBubbleNode(itemUuid: string): BubbleNode {
  return new BubbleNode(itemUuid)
}

export function $isBubbleNode(node: BubbleNode | LexicalNode | null | undefined): node is BubbleNode {
  return node instanceof BubbleNode
}
