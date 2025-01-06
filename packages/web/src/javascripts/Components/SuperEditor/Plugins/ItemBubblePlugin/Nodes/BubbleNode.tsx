import { DOMConversionMap, DOMExportOutput, DecoratorNode, LexicalEditor, NodeKey } from 'lexical'
import { $createBubbleNode, convertToBubbleElement } from './BubbleUtils'
import { BubbleComponent } from './BubbleComponent'
import { SerializedBubbleNode } from './SerializedBubbleNode'
import { ItemNodeInterface } from '../../ItemNodeInterface'

export class BubbleNode extends DecoratorNode<JSX.Element> implements ItemNodeInterface {
  __id: string

  static getType(): string {
    return 'snbubble'
  }

  static clone(node: BubbleNode): BubbleNode {
    return new BubbleNode(node.__id, node.__key)
  }

  static importJSON(serializedNode: SerializedBubbleNode): BubbleNode {
    return $createBubbleNode(serializedNode.itemUuid).updateFromJSON(serializedNode)
  }

  override exportJSON(): SerializedBubbleNode {
    return {
      ...super.exportJSON(),
      itemUuid: this.getId(),
    }
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (!domNode.hasAttribute('data-lexical-item-uuid')) {
          return null
        }
        return {
          conversion: convertToBubbleElement,
          priority: 2,
        }
      },
    }
  }

  createDOM(): HTMLElement {
    return document.createElement('span')
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('span')
    element.setAttribute('data-lexical-item-uuid', this.__id)
    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  updateDOM(): false {
    return false
  }

  constructor(id: string, key?: NodeKey) {
    super(key)
    this.__id = id
  }

  getId(): string {
    return this.__id
  }

  getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string {
    return `[Item: ${this.__id}]`
  }

  decorate(_editor: LexicalEditor): JSX.Element {
    return <BubbleComponent node={this} itemUuid={this.__id} />
  }
}
