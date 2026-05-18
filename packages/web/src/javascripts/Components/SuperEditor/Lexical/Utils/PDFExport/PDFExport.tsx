import { StyleSheet } from '@react-pdf/renderer'
import {
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isLineBreakNode,
  $isTextNode,
  LexicalEditor,
  LexicalNode,
  ElementNode,
  TextNode,
} from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $isHeadingNode, type HeadingNode, $isQuoteNode } from '@lexical/rich-text'
import { $isListNode, $isListItemNode, ListType } from '@lexical/list'
import { $isHorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { $isTableNode, $isTableRowNode, $isTableCellNode } from '@lexical/table'
import { $isCodeNode } from '@lexical/code'
import { $isInlineFileNode } from '../../../Plugins/InlineFilePlugin/InlineFileNode'
import { $isRemoteImageNode } from '../../../Plugins/RemoteImagePlugin/RemoteImageNode'
import { $isCollapsibleContainerNode } from '../../../Plugins/CollapsiblePlugin/CollapsibleContainerNode'
import { $isCollapsibleContentNode } from '../../../Plugins/CollapsiblePlugin/CollapsibleContentNode'
import { $isCollapsibleTitleNode } from '../../../Plugins/CollapsiblePlugin/CollapsibleTitleNode'
// @ts-expect-error TS thinks there's no default export but that is added by the webpack loader.
import PDFWorker, { PDFDataNode, PDFWorkerInterface } from './PDFWorker.worker'
import { wrap } from 'comlink'
import { PrefKey, PrefValue } from '@standardnotes/snjs'
import {
  FALLBACK_FONT_FAMILY,
  FALLBACK_FONT_SOURCE,
  FONT_ASSETS_BASE_PATH,
  FontFamily,
  MONOSPACE_FONT_FAMILY,
  getFontFamiliesFromLexicalNode,
} from './FontConfig'
import {
  PDF_BASE_FONT_SIZE,
  PDF_BLOCK_GAP,
  PDF_LINE_HEIGHT_MULTIPLIER,
  PDF_LIST_ITEM_GAP,
  PDF_QUOTE_INNER_GAP,
} from './PDFLayoutConstants'

const PDF_SUPERSUBSCRIPT_FONT_SIZE = 9
const PDF_HEADING_SUPERSUBSCRIPT_SCALE = 0.75

const styles = StyleSheet.create({
  block: {
    gap: PDF_BLOCK_GAP,
  },
  wrap: {
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  listMarker: {
    flexShrink: 0,
    height: '100%',
    marginRight: 2,
  },
  collapsibleTitle: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingTop: 4,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  quote: {
    borderLeftWidth: 4,
    color: 'rgba(46, 46, 46)',
    borderLeftColor: '#72767e',
    paddingLeft: 12,
    paddingVertical: 4,
    gap: PDF_QUOTE_INNER_GAP,
  },
})

const getListItemNode = ({
  children,
  value,
  listType,
  checked,
}: {
  children: PDFDataNode[] | undefined
  value: number
  listType: ListType
  checked?: boolean
}): PDFDataNode => {
  const marker = listType === 'bullet' ? '\u2022' : `${value}.`

  return {
    type: 'View',
    style: styles.row,
    children: [
      listType === 'check'
        ? {
            type: 'View',
            style: {
              width: 14,
              height: 14,
              borderRadius: 2,
              borderWidth: 1,
              borderColor: checked ? '#086dd6' : '#000',
              backgroundColor: checked ? '#086dd6' : 'transparent',
              marginRight: 6,
            },
            children: checked
              ? [
                  {
                    type: 'Svg',
                    viewBox: '0 0 20 20',
                    fill: '#ffffff',
                    children: [
                      {
                        type: 'Path',
                        d: 'M17.5001 5.83345L7.50008 15.8334L2.91675 11.2501L4.09175 10.0751L7.50008 13.4751L16.3251 4.65845L17.5001 5.83345Z',
                      },
                    ],
                  },
                ]
              : undefined,
          }
        : {
            type: 'View',
            style: styles.listMarker,
            children: [
              {
                type: 'Text',
                children: marker + ' ',
              },
            ],
          },
      {
        type: 'Text',
        style: {
          flex: 1,
          lineHeight: PDF_BASE_FONT_SIZE * PDF_LINE_HEIGHT_MULTIPLIER,
        },
        children,
      },
    ],
  }
}

const HEADING_FONT_SIZES = [1.625, 1.375, 1.125, 0.875, 0.625, 0.375]

const getFontSizeForHeading = (heading: HeadingNode) => {
  const level = parseInt(heading.getTag().slice(1))
  return (HEADING_FONT_SIZES[level - 1] ?? 1) * PDF_BASE_FONT_SIZE
}

const getPDFTextFontFamily = (
  node: TextNode,
  fontFamilies: FontFamily[],
  useCustomFonts: boolean,
  isInlineCode: boolean,
  isCodeNodeText: boolean,
): FontFamily | FontFamily[] => {
  if (isInlineCode && isCodeNodeText) {
    return MONOSPACE_FONT_FAMILY
  }

  if (useCustomFonts) {
    const nodeFontFamilies = getFontFamiliesFromLexicalNode(node)
    fontFamilies.push(...nodeFontFamilies)
    return [...nodeFontFamilies, FALLBACK_FONT_FAMILY]
  }

  return FALLBACK_FONT_FAMILY
}

const getPDFTextFontSize = (
  isInlineCode: boolean,
  isCodeNodeText: boolean,
  isSuperscript: boolean,
  isSubscript: boolean,
  headingFontSize: number | undefined,
): number | undefined => {
  const baseFontSize = isInlineCode || isCodeNodeText ? 11 : undefined

  if (isSuperscript || isSubscript) {
    if (headingFontSize) {
      return Math.max(PDF_SUPERSUBSCRIPT_FONT_SIZE, Math.round(headingFontSize * PDF_HEADING_SUPERSUBSCRIPT_SCALE))
    }
    return PDF_SUPERSUBSCRIPT_FONT_SIZE
  }

  return baseFontSize
}

const getPDFTextLineHeight = (isHeading: boolean, headingFontSize: number | undefined): string => {
  const size =
    isHeading && headingFontSize
      ? headingFontSize * PDF_LINE_HEIGHT_MULTIPLIER
      : PDF_BASE_FONT_SIZE * PDF_LINE_HEIGHT_MULTIPLIER

  return `${size}px`
}

const getPDFTextDecoration = (node: TextNode): 'underline' | 'line-through' | undefined => {
  if (node.hasFormat('underline')) {
    return 'underline'
  }
  if (node.hasFormat('strikethrough')) {
    return 'line-through'
  }
  return undefined
}

const getPDFTextDataNodeFromLexicalTextNode = (
  node: TextNode,
  parent: LexicalNode | null,
  fontFamilies: FontFamily[],
  useCustomFonts: boolean,
): PDFDataNode => {
  const isInlineCode = node.hasFormat('code')
  const isCodeNodeText = $isCodeNode(parent)
  const isHeading = $isHeadingNode(parent)
  const isSuperscript = node.hasFormat('superscript')
  const isSubscript = node.hasFormat('subscript')
  const headingFontSize = isHeading ? getFontSizeForHeading(parent) : undefined

  return {
    type: 'Text',
    children: node.getTextContent(),
    style: {
      fontFamily: getPDFTextFontFamily(node, fontFamilies, useCustomFonts, isInlineCode, isCodeNodeText),
      fontWeight: node.hasFormat('bold') || isHeading ? 'bold' : 'normal',
      fontStyle: node.hasFormat('italic') ? 'italic' : 'normal',
      textDecoration: getPDFTextDecoration(node),
      backgroundColor: isInlineCode ? '#f1f1f1' : node.hasFormat('highlight') ? 'rgb(255,255,0)' : undefined,
      fontSize: getPDFTextFontSize(isInlineCode, isCodeNodeText, isSuperscript, isSubscript, headingFontSize),
      verticalAlign: isSuperscript ? 'super' : isSubscript ? 'sub' : undefined,
      lineHeight: getPDFTextLineHeight(isHeading, headingFontSize),
    },
  }
}

const getNodeTextAlignment = (node: ElementNode) => {
  const direction = node.getDirection()

  if (direction === 'rtl') {
    return 'right'
  }

  const formatType = node.getFormatType()

  if (!formatType) {
    return 'left'
  }

  if (formatType === 'start') {
    return 'left'
  }

  if (formatType === 'end') {
    return 'right'
  }

  return formatType
}

const getNodeDirection = (node: ElementNode) => {
  const direction = node.getDirection()
  return direction ?? 'ltr'
}

const getPDFDataNodeFromLexicalNode = (
  node: LexicalNode,
  fontFamilies: FontFamily[],
  useCustomFonts: boolean = false,
): PDFDataNode => {
  const parent = node.getParent()

  if ($isLineBreakNode(node)) {
    return {
      type: 'Text',
      children: '\n',
    }
  }

  if ($isTextNode(node)) {
    return getPDFTextDataNodeFromLexicalTextNode(node, parent, fontFamilies, useCustomFonts)
  }

  if ($isCodeNode(node)) {
    const children = node.getChildren()
    const lines: LexicalNode[][] = [[]]

    for (let i = 0, currentLine = 0; i < children.length; i++) {
      const child = children[i]

      if (!$isLineBreakNode(child)) {
        lines[currentLine].push(child)
      } else {
        lines.push([])
        currentLine++
      }
    }

    return {
      type: 'View',
      style: [
        styles.column,
        {
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: 12,
          borderRadius: 6,
          fontFamily: 'Courier',
        },
      ],
      children: lines.map((line) => {
        return {
          type: 'View',
          style: [styles.row, styles.wrap],
          children: line.map((child) => {
            return getPDFDataNodeFromLexicalNode(child, fontFamilies, useCustomFonts)
          }),
        }
      }),
    }
  }

  if ($isInlineFileNode(node) || $isRemoteImageNode(node)) {
    if (!node.__src.startsWith('data:')) {
      return {
        type: 'View',
        style: styles.block,
        children: [
          {
            type: 'Link',
            src: node.__src,
            children: node.__src,
          },
        ],
      }
    }
    return {
      type: 'Image',
      src: node.__src,
    }
  }

  const children =
    $isElementNode(node) || $isTableNode(node) || $isTableCellNode(node) || $isTableRowNode(node)
      ? node.getChildren().map((child) => {
          return getPDFDataNodeFromLexicalNode(child, fontFamilies, useCustomFonts)
        })
      : undefined

  if ($isLinkNode(node)) {
    return {
      type: 'Link',
      src: node.getURL(),
      children,
    }
  }

  if ($isListItemNode(node)) {
    if (!$isListNode(parent)) {
      return null
    }

    const listType = parent.getListType()

    const isNestedList = node.getChildren().some((child) => $isListNode(child))

    if (isNestedList) {
      return {
        type: 'View',
        style: [
          styles.column,
          {
            marginLeft: 10,
          },
        ],
        children,
      }
    }

    return getListItemNode({
      children,
      listType,
      value: node.getValue(),
      checked: node.getChecked(),
    })
  }

  if ($isListNode(node)) {
    return {
      type: 'View',
      style: [
        styles.column,
        {
          gap: PDF_LIST_ITEM_GAP,
        },
      ],
      children,
    }
  }

  if ($isCollapsibleContentNode(node)) {
    return {
      type: 'View',
      style: [
        styles.block,
        styles.column,
        {
          padding: 6,
        },
      ],
      children,
    }
  }

  if ($isCollapsibleContainerNode(node)) {
    return {
      type: 'View',
      style: [
        styles.column,
        {
          backgroundColor: 'rgba(0,0,0,0.05)',
          borderRadius: 6,
        },
      ],
      children,
    }
  }

  if ($isParagraphNode(node) && node.getTextContent().length === 0) {
    return {
      type: 'View',
      style: {
        height: PDF_BASE_FONT_SIZE * 1.5,
      },
    }
  }

  if ($isTableCellNode(node)) {
    return {
      type: 'View',
      style: {
        backgroundColor: node.hasHeader() ? '#f4f5f7' : undefined,
        borderColor: '#e3e3e3',
        borderWidth: 1,
        flex: 1,
        padding: 2,
      },
      children,
    }
  }

  if ($isTableRowNode(node)) {
    return {
      type: 'View',
      style: styles.row,
      children,
    }
  }

  if ($isTableNode(node)) {
    return {
      type: 'View',
      children,
    }
  }

  if ($isHorizontalRuleNode(node)) {
    return {
      type: 'View',
      style: {
        borderBottomWidth: 1,
        borderBottomColor: '#cccccc',
        marginVertical: 10,
        width: '100%',
      },
    }
  }

  if ($isElementNode(node)) {
    return {
      type: 'View',
      style: [
        styles.block,
        styles.row,
        styles.wrap,
        {
          fontSize: $isHeadingNode(node) ? getFontSizeForHeading(node) : undefined,
        },
        $isCollapsibleTitleNode(node) ? styles.collapsibleTitle : {},
        $isQuoteNode(node) ? styles.quote : {},
      ],
      children: [
        {
          type: 'Text',
          style: {
            textAlign: getNodeTextAlignment(node),
            direction: getNodeDirection(node),
          },
          children,
        },
      ],
    }
  }

  return {
    type: 'View',
    style: [styles.block, styles.row, styles.wrap],
    children: [{ type: 'Text', children: node.getTextContent() }],
  }
}

const getPDFDataNodesFromLexicalNodes = (
  nodes: LexicalNode[],
  fontFamilies: FontFamily[],
  useCustomFonts: boolean,
): PDFDataNode[] => {
  return nodes.map((node) => getPDFDataNodeFromLexicalNode(node, fontFamilies, useCustomFonts))
}

const pdfWorker = new PDFWorker()
const PDFWorkerComlink = wrap<PDFWorkerInterface>(pdfWorker)

const shouldUseCustomFonts = async () => {
  try {
    const response = await fetch(`${FONT_ASSETS_BASE_PATH}${FALLBACK_FONT_SOURCE}`, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

/**
 * @returns The PDF as an object url
 */
export function $generatePDFFromNodes(editor: LexicalEditor, pageSize: PrefValue[PrefKey.SuperNoteExportPDFPageSize]) {
  return new Promise<string>((resolve, reject) => {
    shouldUseCustomFonts()
      .then((useCustomFonts) => {
        editor.getEditorState().read(() => {
          const root = $getRoot()
          const nodes = root.getChildren()
          const fontFamilies: FontFamily[] = []

          const pdfDataNodes = getPDFDataNodesFromLexicalNodes(nodes, fontFamilies, useCustomFonts)

          void PDFWorkerComlink.renderPDF(pdfDataNodes, pageSize, fontFamilies, useCustomFonts)
            .then((blob) => {
              const url = URL.createObjectURL(blob)
              resolve(url)
            })
            .catch((error) => {
              reject(error)
            })
        })
      })
      .catch((error) => {
        reject(error)
      })
  })
}
