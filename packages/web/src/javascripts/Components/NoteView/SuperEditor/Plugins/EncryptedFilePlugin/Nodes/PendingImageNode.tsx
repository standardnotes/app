import { DecoratorBlockNode, SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { DOMConversionMap, Spread } from 'lexical'
import PendingImageComponent from './PendingImageComponent'

type SerializedPendingImageNode = Spread<
  {
    version: 1
    type: 'pending-image'
    src: string
  },
  SerializedDecoratorBlockNode
>

export class PendingImageNode extends DecoratorBlockNode {
  __src: string

  static getType(): string {
    return 'pending-image'
  }

  constructor(src: string) {
    super()
    this.__src = src
  }

  static clone(node: PendingImageNode): PendingImageNode {
    return new PendingImageNode(node.__src)
  }

  static importJSON(serializedNode: SerializedPendingImageNode): PendingImageNode {
    const node = $createPendingImageNode(serializedNode.src)
    return node
  }

  exportJSON(): SerializedPendingImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      version: 1,
      type: 'pending-image',
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
              node: $createPendingImageNode(domNode.currentSrc || domNode.src),
            }
          },
          priority: 2,
        }
      },
    }
  }

  decorate(): JSX.Element {
    return <PendingImageComponent src={this.__src} />
  }
}

export function $createPendingImageNode(src: string): PendingImageNode {
  return new PendingImageNode(src)
}
