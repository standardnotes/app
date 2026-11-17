import { $getRoot, $getSelection, $isRangeSelection, LexicalEditor, TextNode } from 'lexical'

/** Counts only the note's own text, never rendered decorators, so the offset resolves identically on every device. */
export function $getCaretTextOffset(): number | undefined {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) {
    return undefined
  }

  const { type, offset } = selection.focus
  const focusNode = selection.focus.getNode()

  let position = 0

  for (const node of $getRoot().getAllTextNodes()) {
    if (node.is(focusNode)) {
      return position + (type === 'text' ? offset : 0)
    }

    if (!node.isBefore(focusNode) || focusNode.isParentOf(node)) {
      break
    }

    position += node.getTextContentSize()
  }

  return position
}

export function getSuperEditorCaretOffset(editor: LexicalEditor): number | undefined {
  return editor.getEditorState().read($getCaretTextOffset)
}

export function $selectCaretTextOffset(offset: number): boolean {
  let position = 0
  let lastTextNode: TextNode | undefined

  for (const node of $getRoot().getAllTextNodes()) {
    const size = node.getTextContentSize()

    if (offset <= position + size) {
      const offsetInNode = Math.max(offset - position, 0)
      node.select(offsetInNode, offsetInNode)
      return true
    }

    position += size
    lastTextNode = node
  }

  lastTextNode?.selectEnd()
  return !!lastTextNode
}
