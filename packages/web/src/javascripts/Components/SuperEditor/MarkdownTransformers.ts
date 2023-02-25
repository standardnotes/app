import {
  CHECK_LIST,
  ELEMENT_TRANSFORMERS,
  ElementTransformer,
  TEXT_FORMAT_TRANSFORMERS,
  TEXT_MATCH_TRANSFORMERS,
  TextMatchTransformer,
} from '@lexical/markdown'

import {
  HorizontalRuleNode,
  $createHorizontalRuleNode,
  $isHorizontalRuleNode,
} from '@lexical/react/LexicalHorizontalRuleNode'
import { LexicalNode } from 'lexical'
import {
  $createRemoteImageNode,
  $isRemoteImageNode,
  RemoteImageNode,
} from './Plugins/RemoteImagePlugin/RemoteImageNode'

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

const IMAGE: TextMatchTransformer = {
  dependencies: [RemoteImageNode],
  export: (node) => {
    if (!$isRemoteImageNode(node)) {
      return null
    }

    return `![${node.__alt ? node.__alt : 'image'}](${node.__src})`
  },
  importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
  regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
  replace: (textNode, match) => {
    const [, alt, src] = match
    const imageNode = $createRemoteImageNode(src, alt)
    textNode.replace(imageNode)
  },
  trigger: ')',
  type: 'text-match',
}

export const MarkdownTransformers = [
  CHECK_LIST,
  IMAGE,
  ...ELEMENT_TRANSFORMERS,
  ...TEXT_FORMAT_TRANSFORMERS,
  ...TEXT_MATCH_TRANSFORMERS,
  HorizontalRule,
]
