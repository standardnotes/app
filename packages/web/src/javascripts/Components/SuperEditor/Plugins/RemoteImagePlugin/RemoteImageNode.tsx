import { DecoratorBlockNode, SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { DOMConversionMap, DOMExportOutput, Spread } from 'lexical'
import RemoteImageComponent from './RemoteImageComponent'

type SerializedRemoteImageNode = Spread<
  {
    version: 1
    type: 'unencrypted-image'
    src: string
  },
  SerializedDecoratorBlockNode
>

export class RemoteImageNode extends DecoratorBlockNode {
  __src: string

  static getType(): string {
    return 'unencrypted-image'
  }

  constructor(src: string) {
    super()
    this.__src = src
  }

  static clone(node: RemoteImageNode): RemoteImageNode {
    return new RemoteImageNode(node.__src)
  }

  static importJSON(serializedNode: SerializedRemoteImageNode): RemoteImageNode {
    const node = $createRemoteImageNode(serializedNode.src)
    return node
  }

  exportJSON(): SerializedRemoteImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      version: 1,
      type: 'unencrypted-image',
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
              node: $createRemoteImageNode(domNode.currentSrc || domNode.src),
            }
          },
          priority: 2,
        }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    return { element }
  }

  decorate(): JSX.Element {
    return <RemoteImageComponent node={this} src={this.__src} />
  }
}

export function $createRemoteImageNode(src: string): RemoteImageNode {
  return new RemoteImageNode(src)
}
