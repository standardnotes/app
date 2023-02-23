import { DecoratorBlockNode, SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'
import { DOMConversionMap, Spread } from 'lexical'
import UnencryptedImageComponent from './UnencryptedImageComponent'

type SerializedUnencryptedImageNode = Spread<
  {
    version: 1
    type: 'unencrypted-image'
    src: string
  },
  SerializedDecoratorBlockNode
>

export class UnencryptedImageNode extends DecoratorBlockNode {
  __src: string

  static getType(): string {
    return 'unencrypted-image'
  }

  constructor(src: string) {
    super()
    this.__src = src
  }

  static clone(node: UnencryptedImageNode): UnencryptedImageNode {
    return new UnencryptedImageNode(node.__src)
  }

  static importJSON(serializedNode: SerializedUnencryptedImageNode): UnencryptedImageNode {
    const node = $createUnencryptedImageNode(serializedNode.src)
    return node
  }

  exportJSON(): SerializedUnencryptedImageNode {
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
              node: $createUnencryptedImageNode(domNode.currentSrc || domNode.src),
            }
          },
          priority: 2,
        }
      },
    }
  }

  decorate(): JSX.Element {
    return <UnencryptedImageComponent node={this} src={this.__src} />
  }
}

export function $createUnencryptedImageNode(src: string): UnencryptedImageNode {
  return new UnencryptedImageNode(src)
}
