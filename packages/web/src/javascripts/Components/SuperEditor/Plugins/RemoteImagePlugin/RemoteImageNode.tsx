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
import RemoteImageComponent from './RemoteImageComponent'

type SerializedRemoteImageNode = Spread<
  {
    alt: string | undefined
    src: string
  },
  SerializedDecoratorBlockNode
>

export class RemoteImageNode extends DecoratorBlockNode {
  __alt: string | undefined
  __src: string

  static getType(): string {
    return 'unencrypted-image'
  }

  constructor(src: string, alt?: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__src = src
    this.__alt = alt
  }

  static clone(node: RemoteImageNode): RemoteImageNode {
    return new RemoteImageNode(node.__src, node.__alt, node.__format, node.__key)
  }

  static importJSON(serializedNode: SerializedRemoteImageNode): RemoteImageNode {
    return $createRemoteImageNode(serializedNode.src, serializedNode.alt).updateFromJSON(serializedNode)
  }

  exportJSON(): SerializedRemoteImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      alt: this.__alt,
    }
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      img: (domNode: HTMLDivElement) => {
        if (domNode.tagName !== 'IMG') {
          return null
        }
        return {
          conversion: () => {
            if (!(domNode instanceof HTMLImageElement)) {
              return null
            }
            return {
              node: $createRemoteImageNode(domNode.currentSrc || domNode.src, domNode.alt),
            }
          },
          priority: 2,
        }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    if (this.__alt) {
      element.setAttribute('alt', this.__alt)
    }
    element.setAttribute('src', this.__src)
    return { element }
  }

  override getTextContent(): string {
    return `![${this.__alt || 'image'}](${this.__src})`
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    }

    return (
      <RemoteImageComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        node={this}
        src={this.__src}
        alt={this.__alt}
      />
    )
  }
}

export function $isRemoteImageNode(node: RemoteImageNode | LexicalNode | null | undefined): node is RemoteImageNode {
  return node instanceof RemoteImageNode
}

export function $createRemoteImageNode(src: string, alt?: string): RemoteImageNode {
  return new RemoteImageNode(src, alt)
}
