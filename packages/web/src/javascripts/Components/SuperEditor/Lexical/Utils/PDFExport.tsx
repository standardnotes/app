import { getBase64FromBlob } from '@/Utils'
import { Document, Page, View, Text, StyleSheet, pdf } from '@react-pdf/renderer'
import { $getRoot, LexicalEditor } from 'lexical'

const pdfStyles = StyleSheet.create({
  page: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  text: {
    marginVertical: 5,
    fontSize: 14,
  },
})

const PDFDocument = ({ nodes }: { nodes: string[] }) => {
  return (
    <Document>
      <Page style={pdfStyles.page}>
        <View>
          {nodes.map((node, index) => {
            return (
              <Text key={index} style={pdfStyles.text}>
                {node}
              </Text>
            )
          })}
        </View>
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
      const nodes = root.getChildren().map((node) => {
        return node.getTextContent()
      })

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
