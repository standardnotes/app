import {
  Document,
  Page,
  View,
  Text,
  pdf,
  Link,
  Image,
  Svg,
  Path,
  ViewProps,
  LinkProps,
  PathProps,
  TextProps,
  SVGProps,
  ImageWithSrcProp,
  PageProps,
} from '@react-pdf/renderer'
import { expose } from 'comlink'
import { FontFamily, registerPDFFonts } from './FontConfig'
import { PDF_BASE_FONT_SIZE, PDF_BLOCK_GAP } from './PDFLayoutConstants'

export type PDFDataNode =
  | ((
      | ({
          type: 'View'
        } & Omit<ViewProps, 'children'>)
      | ({
          type: 'Text'
        } & Omit<TextProps, 'children'>)
      | ({
          type: 'Link'
        } & Omit<LinkProps, 'children'>)
      | ({
          type: 'Image'
        } & Omit<ImageWithSrcProp, 'children'>)
      | ({
          type: 'Svg'
        } & Omit<SVGProps, 'children'>)
      | ({
          type: 'Path'
        } & Omit<PathProps, 'children'>)
    ) & {
      children?: PDFDataNode[] | string
    })
  | null

const Node = ({ node }: { node: PDFDataNode }) => {
  if (!node) {
    return null
  }

  const children =
    typeof node.children === 'string'
      ? node.children
      : node.children?.map((child, index) => {
          return <Node node={child} key={index} />
        })

  switch (node.type) {
    case 'View':
      return <View {...node}>{children}</View>
    case 'Text':
      return <Text {...node}>{children}</Text>
    case 'Link':
      return <Link {...node}>{children}</Link>
    case 'Image':
      return <Image {...node} />
    case 'Svg':
      return <Svg {...node}>{children}</Svg>
    case 'Path': {
      const { children: _, ...props } = node
      return <Path {...props} />
    }
  }
}

const PDFDocument = ({ nodes, pageSize }: { nodes: PDFDataNode[]; pageSize: PageProps['size'] }) => {
  return (
    <Document>
      <Page
        size={pageSize}
        style={{
          paddingVertical: 35,
          paddingHorizontal: 35,
          fontSize: PDF_BASE_FONT_SIZE,
          gap: PDF_BLOCK_GAP,
        }}
      >
        {nodes.map((node, index) => {
          return <Node node={node} key={index} />
        })}
      </Page>
    </Document>
  )
}

const renderPDF = (
  nodes: PDFDataNode[],
  pageSize: PageProps['size'],
  fontFamilies: FontFamily[],
  useCustomFonts: boolean = false,
) => {
  if (useCustomFonts) {
    registerPDFFonts(fontFamilies)
  }
  return pdf(<PDFDocument pageSize={pageSize} nodes={nodes} />).toBlob()
}

expose({
  renderPDF,
})

export type PDFWorkerInterface = {
  renderPDF: typeof renderPDF
}
