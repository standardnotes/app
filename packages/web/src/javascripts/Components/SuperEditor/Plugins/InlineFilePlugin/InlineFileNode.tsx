import { DecoratorBlockNode, SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical'
import InlineFileComponent from './InlineFileComponent'

type SerializedInlineFileNode = Spread<
  {
    fileName: string | undefined
    mimeType: string
    src: string
  },
  SerializedDecoratorBlockNode
>

export class InlineFileNode extends DecoratorBlockNode {
  __fileName: string | undefined
  __mimeType: string
  __src: string

  static getType(): string {
    return 'inline-file'
  }

  constructor(src: string, mimeType: string, fileName: string | undefined, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__src = src
    this.__mimeType = mimeType
    this.__fileName = fileName
  }

  static clone(node: InlineFileNode): InlineFileNode {
    return new InlineFileNode(node.__src, node.__mimeType, node.__fileName, node.__format, node.__key)
  }

  static importJSON(serializedNode: SerializedInlineFileNode): InlineFileNode {
    const node = $createInlineFileNode(
      serializedNode.src,
      serializedNode.mimeType,
      serializedNode.fileName,
    ).updateFromJSON(serializedNode)
    return node
  }

  exportJSON(): SerializedInlineFileNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      mimeType: this.__mimeType,
      fileName: this.__fileName,
    }
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      object: (domNode: HTMLDivElement) => {
        if (domNode.tagName !== 'OBJECT') {
          return null
        }
        return {
          conversion: () => {
            if (!(domNode instanceof HTMLObjectElement)) {
              return null
            }
            const mimeType = domNode.type || 'application/octet-stream'
            const fileName = domNode.getAttribute('data-file-name') || undefined
            const src = domNode.data
            return {
              node: $createInlineFileNode(src, mimeType, fileName),
            }
          },
          priority: 2,
        }
      },
      img: (domNode: HTMLDivElement) => {
        if (domNode.tagName !== 'IMG') {
          return null
        }
        return {
          conversion: () => {
            if (!(domNode instanceof HTMLImageElement)) {
              return null
            }
            const mimeType = domNode.getAttribute('data-mime-type') || 'image/png'
            const fileName = domNode.getAttribute('data-file-name') || domNode.alt
            return {
              node: $createInlineFileNode(domNode.currentSrc || domNode.src, mimeType, fileName),
            }
          },
          priority: 2,
        }
      },
      source: (domNode: HTMLDivElement) => {
        if (domNode.tagName !== 'SOURCE') {
          return null
        }
        const parent = domNode.parentElement
        const isParentVideoOrAudio = !!parent && (parent.tagName === 'VIDEO' || parent.tagName === 'AUDIO')
        if (!isParentVideoOrAudio) {
          return null
        }
        return {
          conversion: () => {
            if (!(domNode instanceof HTMLSourceElement)) {
              return null
            }
            const mimeType = domNode.type || parent.tagName === 'VIDEO' ? 'video/mp4' : 'audio/mp3'
            const src = domNode.src
            const fileName = domNode.getAttribute('data-file-name') || undefined
            return {
              node: $createInlineFileNode(src, mimeType, fileName),
            }
          },
          priority: 2,
        }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    if (this.__mimeType.startsWith('image/')) {
      const img = document.createElement('img')
      img.setAttribute('src', this.__src)
      img.setAttribute('data-mime-type', this.__mimeType)
      img.setAttribute('data-file-name', this.__fileName || '')
      return { element: img }
    } else if (this.__mimeType.startsWith('audio')) {
      const audio = document.createElement('audio')
      audio.setAttribute('controls', '')
      audio.setAttribute('data-file-name', this.__fileName || '')
      const source = document.createElement('source')
      source.setAttribute('src', this.__src)
      source.setAttribute('type', this.__mimeType)
      audio.appendChild(source)
      return { element: audio }
    } else if (this.__mimeType.startsWith('video')) {
      const video = document.createElement('video')
      video.setAttribute('controls', '')
      video.setAttribute('data-file-name', this.__fileName || '')
      const source = document.createElement('source')
      source.setAttribute('src', this.__src)
      source.setAttribute('type', this.__mimeType)
      video.appendChild(source)
      return { element: video }
    }
    const object = document.createElement('object')
    object.setAttribute('data', this.__src)
    object.setAttribute('type', this.__mimeType)
    object.setAttribute('data-file-name', this.__fileName || '')
    return { element: object }
  }

  getTextContent(): string {
    return `${this.__mimeType.startsWith('image/') ? '!' : ''}[${this.__fileName}](${this.__src})`
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    }

    return (
      <InlineFileComponent
        className={className}
        format={this.__format}
        node={this}
        nodeKey={this.getKey()}
        src={this.__src}
        mimeType={this.__mimeType}
        fileName={this.__fileName}
      />
    )
  }
}

export function $isInlineFileNode(node: InlineFileNode | LexicalNode | null | undefined): node is InlineFileNode {
  return node instanceof InlineFileNode
}

export function $createInlineFileNode(src: string, mimeType: string, fileName: string | undefined): InlineFileNode {
  return new InlineFileNode(src, mimeType, fileName)
}
