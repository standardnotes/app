import { getBase64FromBlob } from '@/Utils'
import { Document, Page, View, Text, StyleSheet, pdf, Link } from '@react-pdf/renderer'
import { $getRoot, $isElementNode, $isTextNode, LexicalEditor, LexicalNode } from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $isHeadingNode } from '@lexical/rich-text'
import { $isListNode, $isListItemNode, ListType } from '@lexical/list'
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
  if ($isTextNode(node)) {
    let font = node.hasFormat('code') ? 'Courier' : 'Helvetica'
    if (node.hasFormat('bold') || node.hasFormat('italic')) {
      font += '-'
      if (node.hasFormat('bold')) {
        font += 'Bold'
      }
      if (node.hasFormat('italic')) {
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
        }}
      >
        {node.getTextContent()}
      </Text>
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
    const parent = node.getParent()
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
