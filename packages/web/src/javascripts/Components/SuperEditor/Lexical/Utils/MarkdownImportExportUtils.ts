import {
  ElementTransformer,
  TextFormatTransformer,
  TextMatchTransformer,
  Transformer,
  ELEMENT_TRANSFORMERS,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  MultilineElementTransformer,
  MULTILINE_ELEMENT_TRANSFORMERS,
} from '@lexical/markdown'
import { LexicalNode, $isParagraphNode, $isTextNode } from 'lexical'

function indexBy<T>(list: Array<T>, callback: (arg0: T) => string): Readonly<Record<string, Array<T>>> {
  const index: Record<string, Array<T>> = {}

  for (const item of list) {
    const key = callback(item)

    if (index[key]) {
      index[key].push(item)
    } else {
      index[key] = [item]
    }
  }

  return index
}

export function transformersByType(transformers: Array<Transformer>): Readonly<{
  element: Array<ElementTransformer>
  multilineElement: Array<MultilineElementTransformer>
  textFormat: Array<TextFormatTransformer>
  textMatch: Array<TextMatchTransformer>
}> {
  const byType = indexBy(transformers, (t) => t.type)

  return {
    element: (byType.element || []) as Array<ElementTransformer>,
    multilineElement: (byType['multiline-element'] || []) as Array<MultilineElementTransformer>,
    textFormat: (byType['text-format'] || []) as Array<TextFormatTransformer>,
    textMatch: (byType['text-match'] || []) as Array<TextMatchTransformer>,
  }
}

const MARKDOWN_EMPTY_LINE_REG_EXP = /^\s{0,3}$/

export function isEmptyParagraph(node: LexicalNode): boolean {
  if (!$isParagraphNode(node)) {
    return false
  }

  const firstChild = node.getFirstChild()
  return (
    firstChild == null ||
    (node.getChildrenSize() === 1 &&
      $isTextNode(firstChild) &&
      MARKDOWN_EMPTY_LINE_REG_EXP.test(firstChild.getTextContent()))
  )
}

export const TRANSFORMERS: Array<Transformer> = [
  ...ELEMENT_TRANSFORMERS,
  ...MULTILINE_ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
]
