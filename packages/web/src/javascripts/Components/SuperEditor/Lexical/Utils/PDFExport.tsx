import { getBase64FromBlob } from '@/Utils'
import { Document, Page, View, Text, StyleSheet, pdf, Link, Image } from '@react-pdf/renderer'
import {
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isLineBreakNode,
  $isTextNode,
  LexicalEditor,
  LexicalNode,
  ElementNode,
} from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $isHeadingNode, type HeadingNode } from '@lexical/rich-text'
import { $isListNode, $isListItemNode, ListType } from '@lexical/list'
import { $isCodeNode } from '@lexical/code'
import { ReactNode } from 'react'
import { $isInlineFileNode } from '../../Plugins/InlineFilePlugin/InlineFileNode'
import { $isRemoteImageNode } from '../../Plugins/RemoteImagePlugin/RemoteImageNode'
import { $isCollapsibleContainerNode } from '../../Plugins/CollapsiblePlugin/CollapsibleContainerNode'
import { $isCollapsibleContentNode } from '../../Plugins/CollapsiblePlugin/CollapsibleContentNode'
import { $isCollapsibleTitleNode } from '../../Plugins/CollapsiblePlugin/CollapsibleTitleNode'

const styles = StyleSheet.create({
  page: {
    paddingVertical: 35,
    paddingHorizontal: 35,
    lineHeight: 1.5,
    fontSize: 12,
    gap: 14,
  },
  block: {
    gap: 14,
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
})

const ListItem = ({ children, value, listType }: { children: ReactNode; value: number; listType: ListType }) => {
  const marker = listType === 'bullet' ? '\u2022' : `${value}.`

  return (
    <View style={[styles.row]}>
      <View style={styles.listMarker}>
        <Text>{marker + ' '}</Text>
      </View>
      <Text>{children}</Text>
    </View>
  )
}

const MinimumHeadingFontSize = 13
const MaxHeadingLevel = 6
const getFontSizeForHeading = (heading: HeadingNode) => {
  const level = parseInt(heading.getTag().slice(1))
  const multiplier = (MaxHeadingLevel - level) * 2

  return MinimumHeadingFontSize + multiplier
}

const getNodeTextAlignment = (node: ElementNode) => {
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

const Node = ({ node }: { node: LexicalNode }) => {
  const parent = node.getParent()

  if ($isLineBreakNode(node)) {
    return <Text>{'\n'}</Text>
  }

  if ($isTextNode(node)) {
    const isInlineCode = node.hasFormat('code')
    const isCodeNodeText = $isCodeNode(parent)
    const isBold = node.hasFormat('bold')
    const isItalic = node.hasFormat('italic')
    const isHighlight = node.hasFormat('highlight')

    let font = isInlineCode || isCodeNodeText ? 'Courier' : 'Helvetica'
    if (isBold || isItalic) {
      font += '-'
      if (isBold) {
        font += 'Bold'
      }
      if (isItalic) {
        font += 'Oblique'
      }
    }

    return (
      <Text
        style={{
          fontFamily: font,
          textDecoration: node.hasFormat('underline')
            ? 'underline'
            : node.hasFormat('strikethrough')
            ? 'line-through'
            : undefined,
          backgroundColor: isInlineCode ? '#f1f1f1' : isHighlight ? 'rgb(255,255,0)' : undefined,
          fontSize: isInlineCode || isCodeNodeText ? 11 : undefined,
          textAlign: $isElementNode(parent) ? getNodeTextAlignment(parent) : 'left',
        }}
      >
        {node.getTextContent()}
      </Text>
    )
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

    return (
      <View
        style={[
          styles.column,
          {
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: 12,
            borderRadius: 6,
            fontFamily: 'Courier',
          },
        ]}
      >
        {lines.map((line, index) => {
          return (
            <View style={[styles.row, styles.wrap]} key={index}>
              {line.map((child, index) => {
                return <Node node={child} key={index} />
              })}
            </View>
          )
        })}
      </View>
    )
  }

  if ($isInlineFileNode(node) || $isRemoteImageNode(node)) {
    if (!node.__src.startsWith('data:')) {
      return (
        <View style={styles.block}>
          <Link src={node.__src}>{node.__src}</Link>
        </View>
      )
    }
    return <Image src={node.__src} />
  }

  const children = $isElementNode(node)
    ? node.getChildren().map((child, index) => {
        return <Node node={child} key={index} />
      })
    : null

  if ($isLinkNode(node)) {
    return <Link src={node.getURL()}>{children}</Link>
  }

  if ($isListItemNode(node)) {
    if (!$isListNode(parent)) {
      return null
    }
    const listType = parent.getListType()

    const isNestedList = node.getChildren().some((child) => $isListNode(child))

    if (isNestedList) {
      return (
        <View
          style={[
            styles.column,
            {
              marginLeft: 10,
            },
          ]}
        >
          {children}
        </View>
      )
    }

    return (
      <ListItem value={node.getValue()} listType={listType}>
        {children}
      </ListItem>
    )
  }

  if ($isListNode(node)) {
    return (
      <View
        style={[
          styles.column,
          {
            gap: 7,
          },
        ]}
      >
        {children}
      </View>
    )
  }

  if ($isCollapsibleContentNode(node)) {
    return (
      <View
        style={[
          styles.block,
          styles.column,
          {
            padding: 6,
          },
        ]}
      >
        {children}
      </View>
    )
  }

  if ($isCollapsibleContainerNode(node)) {
    return (
      <View
        style={[
          styles.column,
          {
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 6,
          },
        ]}
      >
        {children}
      </View>
    )
  }

  if ($isParagraphNode(node) && node.getTextContent().length === 0) {
    return null
  }

  if ($isElementNode(node)) {
    return (
      <View
        style={[
          styles.block,
          styles.row,
          styles.wrap,
          {
            fontSize: $isHeadingNode(node) ? getFontSizeForHeading(node) : undefined,
          },
          $isCollapsibleTitleNode(node) ? styles.collapsibleTitle : {},
        ]}
      >
        <Text
          style={{
            lineHeight: $isHeadingNode(node) ? 1 : 1.5,
          }}
        >
          {children}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.block, styles.row, styles.wrap]}>
      <Text>{node.getTextContent()}</Text>
    </View>
  )
}

const PDFDocument = ({ nodes }: { nodes: LexicalNode[] }) => {
  return (
    <Document>
      <Page style={styles.page}>
        {nodes.map((node, index) => {
          return <Node node={node} key={index} />
        })}
      </Page>
    </Document>
  )
}

/**
 * @returns The PDF as a base64 string
 */
export function $generatePDFFromNodes(editor: LexicalEditor) {
  return new Promise<string>((resolve) => {
    editor.getEditorState().read(() => {
      const root = $getRoot()
      const nodes = root.getChildren()

      const pdfDocument = <PDFDocument nodes={nodes} />

      void pdf(pdfDocument)
        .toBlob()
        .then((blob) =>
          getBase64FromBlob(blob).then((base64) => {
            resolve(base64)
          }),
        )
    })
  })
}
