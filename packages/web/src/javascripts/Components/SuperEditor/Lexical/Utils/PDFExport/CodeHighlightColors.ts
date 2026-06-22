import BlocksEditorTheme from '../../Theme/Theme'

const TOKEN_CLASS_COLORS: Record<string, string> = {
  Lexical__tokenComment: 'slategray',
  Lexical__tokenPunctuation: '#999',
  Lexical__tokenProperty: '#905',
  Lexical__tokenSelector: '#690',
  Lexical__tokenOperator: '#9a6e3a',
  Lexical__tokenAttr: '#07a',
  Lexical__tokenVariable: '#e90',
  Lexical__tokenFunction: '#dd4a68',
}

const HIGHLIGHT_TYPE_TO_COLOR: Record<string, string> = {}

const codeHighlightTheme = BlocksEditorTheme.codeHighlight

if (codeHighlightTheme) {
  for (const [highlightType, tokenClass] of Object.entries(codeHighlightTheme)) {
    const color = TOKEN_CLASS_COLORS[tokenClass]
    if (color) {
      HIGHLIGHT_TYPE_TO_COLOR[highlightType] = color
    }
  }
}

export const getPDFColorForCodeHighlight = (highlightType: string | null | undefined): string | undefined => {
  if (!highlightType) {
    return undefined
  }

  return HIGHLIGHT_TYPE_TO_COLOR[highlightType]
}
