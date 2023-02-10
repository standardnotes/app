import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
} from '@lexical/markdown'

import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode'
import { LexicalNode } from 'lexical'

const HorizontalRule: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  export: (node: LexicalNode) => {
    return $isHorizontalRuleNode(node) ? '***' : null
  },
  regExp: /^(---|\*\*\*|___)\s?$/,
  replace: (parentNode, _1, _2, isImport) => {
    const line = $createHorizontalRuleNode()

    if (isImport || parentNode.getNextSibling() != null) {
      parentNode.replace(line)
    } else {
      parentNode.insertBefore(line)
    }

    line.selectNext()
  },
  type: 'element',
}

export const MarkdownTransformers = [
  CHECK_LIST,
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
  HorizontalRule,
]
