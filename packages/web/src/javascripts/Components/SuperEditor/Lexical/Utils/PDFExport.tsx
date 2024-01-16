import { getBase64FromBlob } from '@/Utils'
import { Document, Page, View, Text, StyleSheet, pdf, Link } from '@react-pdf/renderer'
import { $getRoot, $isElementNode, $isLineBreakNode, $isTextNode, LexicalEditor, LexicalNode } from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode, $isListItemNode, ListType } from '@lexical/list'
import { $isCodeNode } from '@lexical/code'
import { ReactNode } from 'react'

const styles = StyleSheet.create({
  page: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  block: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
    fontSize: 14,
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
  },
})

const ListItem = ({ children, value, listType }: { children: ReactNode; value: number; listType: ListType }) => {
  const marker = listType === 'bullet' ? '\u2022' : `${value}.`

  return (
    <View style={styles.row}>
      <View style={styles.listMarker}>
        <Text>{marker + ' '}</Text>
      </View>
      <Text>{children}</Text>
    </View>
  )
}

const Node = ({ node }: { node: LexicalNode }) => {
  const parent = node.getParent()

  if ($isLineBreakNode(node)) {
    return <Text>{'\n'}</Text>
  }

  if ($isTextNode(node)) {
    const isCode = node.hasFormat('code') || $isCodeNode(parent)
    const isBold = node.hasFormat('bold')
    const isItalic = node.hasFormat('italic')

    let font = isCode ? 'Courier' : 'Helvetica'
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
          backgroundColor: isCode ? '#f1f1f1' : undefined,
          fontSize: isCode ? 12 : undefined,
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
        style={[styles.column, { backgroundColor: '#f1f1f1', padding: 12, borderRadius: 6, fontFamily: 'Courier' }]}
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
    return <View style={[styles.block, styles.column]}>{children}</View>
  }

  if ($isElementNode(node)) {
    return (
      <View
        style={[
          styles.block,
          {
            fontSize: $isHeadingNode(node) ? 16 + (6 - parseInt(node.getTag().slice(1))) * 2 : 14,
          },
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

  return null
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
