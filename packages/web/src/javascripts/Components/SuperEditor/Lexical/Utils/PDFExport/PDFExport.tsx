import { StyleSheet } from '@react-pdf/renderer'
import {
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isLineBreakNode,
  $isTabNode,
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
import { $isCodeHighlightNode, $isCodeNode } from '@lexical/code'
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
import { getPDFColorForCodeHighlight } from './CodeHighlightColors'
import {
  PDF_BASE_FONT_SIZE,
  PDF_BLOCK_GAP,
  PDF_CODE_BLOCK_FONT_SIZE,
  PDF_CODE_TAB_SIZE,
  PDF_LINE_HEIGHT_MULTIPLIER,
  PDF_LIST_ITEM_GAP,
  PDF_PAGE_PADDING,
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

const getPDFTextContent = (node: TextNode, isCodeNodeText: boolean): string => {
  if ($isTabNode(node) && isCodeNodeText) {
    return ' '.repeat(PDF_CODE_TAB_SIZE)
  }

  return node.getTextContent()
}

const getPDFTextFontFamily = (
  node: TextNode,
  fontFamilies: FontFamily[],
  useCustomFonts: boolean,
  isInlineCode: boolean,
  isCodeNodeText: boolean,
): FontFamily | FontFamily[] => {
  if (isCodeNodeText || isInlineCode) {
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
  const baseFontSize = isInlineCode || isCodeNodeText ? PDF_CODE_BLOCK_FONT_SIZE : undefined

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

const getPDFTextColor = (node: TextNode, parent: LexicalNode | null): string | undefined => {
  if ($isCodeHighlightNode(node) && $isCodeNode(parent)) {
    return getPDFColorForCodeHighlight(node.getHighlightType())
  }

  return undefined
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

const isInsideTableHeaderCell = (node: LexicalNode): boolean => {
  return node.getParents().some((parent) => {
    return $isTableCellNode(parent) && parent.hasHeader()
  })
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
    children: getPDFTextContent(node, isCodeNodeText),
    style: {
      fontFamily: getPDFTextFontFamily(node, fontFamilies, useCustomFonts, isInlineCode, isCodeNodeText),
      fontWeight: node.hasFormat('bold') || isHeading || isInsideTableHeaderCell(node) ? 'bold' : 'normal',
      fontStyle: node.hasFormat('italic') ? 'italic' : 'normal',
      textDecoration: getPDFTextDecoration(node),
      backgroundColor: isInlineCode ? '#f1f1f1' : node.hasFormat('highlight') ? 'rgb(255,255,0)' : undefined,
      color: getPDFTextColor(node, parent),
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

const getPDFVerticalSpacer = (height: number = PDF_BASE_FONT_SIZE * PDF_LINE_HEIGHT_MULTIPLIER): PDFDataNode => ({
  type: 'View',
  style: { height },
})

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
          fontFamily: MONOSPACE_FONT_FAMILY,
          fontSize: PDF_CODE_BLOCK_FONT_SIZE,
        },
      ],
      children: lines.map((line) => {
        return {
          type: 'View',
          style: [styles.row, styles.wrap],
          children:
            line.length === 0
              ? [getPDFVerticalSpacer(PDF_CODE_BLOCK_FONT_SIZE * PDF_LINE_HEIGHT_MULTIPLIER)]
              : line
                  .map((child) => getPDFDataNodeFromLexicalNode(child, fontFamilies, useCustomFonts))
                  .filter((child): child is PDFDataNode => child != null),
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
    return getPDFVerticalSpacer()
  }

  if ($isTableCellNode(node)) {
    return {
      type: 'View',
      style: {
        backgroundColor: node.hasHeader() ? '#f4f5f7' : undefined,
        borderColor: '#e3e3e3',
        borderWidth: 1,
        flex: 1,
        paddingHorizontal: 8,
        paddingVertical: 6,
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

/**
 * Page widths in points (72dpi) sourced from PAGE_SIZES in
 * @react-pdf/layout/lib/index.js — verify against that file when upgrading the library.
 */
const PDF_PAGE_WIDTHS_PT: Record<PrefValue[PrefKey.SuperNoteExportPDFPageSize], number> = {
  A3: 841.89,
  A4: 595.28,
  LETTER: 612,
  LEGAL: 612,
  TABLOID: 792,
}

const getPDFContentWidth = (pageSize: PrefValue[PrefKey.SuperNoteExportPDFPageSize]): number => {
  return PDF_PAGE_WIDTHS_PT[pageSize] - 2 * PDF_PAGE_PADDING
}

type PDFImageNaturalDimensions = {
  width: number
  height: number
}

const walkPDFDataNodes = (nodes: PDFDataNode[], visitor: (node: NonNullable<PDFDataNode>) => void): void => {
  const visit = (node: PDFDataNode) => {
    if (!node) {
      return
    }
    visitor(node)
    if (Array.isArray(node.children)) {
      node.children.forEach(visit)
    }
  }
  nodes.forEach(visit)
}

const collectPDFImageSources = (nodes: PDFDataNode[]): string[] => {
  const sources = new Set<string>()
  walkPDFDataNodes(nodes, (node) => {
    if (node.type === 'Image' && typeof node.src === 'string') {
      sources.add(node.src)
    }
  })
  return [...sources]
}

const loadPDFImageDimensions = (src: string): Promise<PDFImageNaturalDimensions | null> => {
  return new Promise((resolve) => {
    const image = new window.Image()
    image.onload = () => {
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        resolve(null)
        return
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

const loadPDFImageDimensionsMap = async (sources: string[]): Promise<Map<string, PDFImageNaturalDimensions>> => {
  const entries = await Promise.all(sources.map(async (src) => [src, await loadPDFImageDimensions(src)] as const))

  const map = new Map<string, PDFImageNaturalDimensions>()
  for (const [src, dimensions] of entries) {
    if (dimensions) {
      map.set(src, dimensions)
    }
  }
  return map
}

const patchPDFImageStyles = (
  nodes: PDFDataNode[],
  contentWidth: number,
  imageDimensions: Map<string, PDFImageNaturalDimensions>,
): void => {
  walkPDFDataNodes(nodes, (node) => {
    if (node.type === 'Image' && typeof node.src === 'string') {
      const natural = imageDimensions.get(node.src)
      if (natural && natural.width > 0 && natural.height > 0) {
        const displayWidth = Math.min(natural.width, contentWidth)
        node.style = { width: displayWidth, height: displayWidth * (natural.height / natural.width) }
      } else {
        node.style = { width: contentWidth }
      }
    }
  })
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
          const contentWidth = getPDFContentWidth(pageSize)
          const pdfDataNodes = getPDFDataNodesFromLexicalNodes(nodes, fontFamilies, useCustomFonts)
          const imageSources = collectPDFImageSources(pdfDataNodes)

          void loadPDFImageDimensionsMap(imageSources)
            .then((imageDimensions) => {
              patchPDFImageStyles(pdfDataNodes, contentWidth, imageDimensions)
              return PDFWorkerComlink.renderPDF(pdfDataNodes, pageSize, fontFamilies, useCustomFonts)
            })
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
