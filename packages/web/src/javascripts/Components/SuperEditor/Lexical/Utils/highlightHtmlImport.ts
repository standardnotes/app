import {
  isHighlightSpanElement,
  SPAN_FONT_SIZE_ATTRIBUTE,
} from '@standardnotes/ui-services/src/Import/HighlightSpanImport'
import { $isTextNode, DOMConversionMap, LexicalNode } from 'lexical'

function setStyleProperty(lexicalNode: LexicalNode, property: string, value: string) {
  if (!$isTextNode(lexicalNode)) {
    return
  }

  const declarations = lexicalNode
    .getStyle()
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration && !declaration.toLowerCase().startsWith(`${property}:`))

  declarations.push(`${property}: ${value}`)
  lexicalNode.setStyle(declarations.join('; '))
}

function applyHighlightToTextChild(domNode: HTMLElement) {
  const backgroundColor = domNode.style.backgroundColor
  const fontSize = domNode.getAttribute(SPAN_FONT_SIZE_ATTRIBUTE)

  return {
    forChild: (lexicalNode: LexicalNode) => {
      if (!$isTextNode(lexicalNode)) {
        return lexicalNode
      }

      if (!lexicalNode.hasFormat('highlight')) {
        lexicalNode.toggleFormat('highlight')
      }

      if (backgroundColor) {
        setStyleProperty(lexicalNode, 'background-color', backgroundColor)
      }
      if (fontSize) {
        setStyleProperty(lexicalNode, 'font-size', fontSize)
      }

      return lexicalNode
    },
    node: null,
  }
}

function applyFontSizeToTextChild(fontSize: string) {
  return {
    forChild: (lexicalNode: LexicalNode) => {
      setStyleProperty(lexicalNode, 'font-size', fontSize)
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
    const element = domNode as HTMLElement

    const fontSize = element.getAttribute(SPAN_FONT_SIZE_ATTRIBUTE)
    if (fontSize) {
      return {
        conversion: () => applyFontSizeToTextChild(fontSize),
        priority: 1,
      }
    }

    if (!isHighlightSpanElement(element)) {
      return null
    }

    return {
      conversion: applyHighlightToTextChild,
      priority: 1,
    }
  },
}
