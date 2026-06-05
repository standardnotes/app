import { isHighlightSpanElement } from '@standardnotes/ui-services/src/Import/HighlightSpanImport'
import { $isTextNode, DOMConversionMap, LexicalNode } from 'lexical'

function applyHighlightToTextChild(domNode: HTMLElement) {
  const backgroundColor = domNode.style.backgroundColor

  return {
    forChild: (lexicalNode: LexicalNode) => {
      if (!$isTextNode(lexicalNode)) {
        return lexicalNode
      }

      if (!lexicalNode.hasFormat('highlight')) {
        lexicalNode.toggleFormat('highlight')
      }

      if (backgroundColor) {
        lexicalNode.setStyle(`background-color: ${backgroundColor}`)
      }

      return lexicalNode
    },
    node: null,
  }
}

export const highlightHtmlImport: DOMConversionMap = {
  mark: () => ({
    conversion: applyHighlightToTextChild,
    priority: 1,
  }),
  span: (domNode) => {
    if (!isHighlightSpanElement(domNode as HTMLElement)) {
      return null
    }

    return {
      conversion: applyHighlightToTextChild,
      priority: 1,
    }
  },
}
