import { ListNode, SerializedListNode } from '@lexical/list'
import { DOMExportOutput, LexicalEditor, Spread } from 'lexical'

export type SerializedListHTMLExportNode = Spread<
  {
    type: 'list-html-export'
  },
  SerializedListNode
>

export class ListHTMLExportNode extends ListNode {
  static getType(): string {
    return 'list-html-export'
  }

  static clone(node: ListNode): ListHTMLExportNode {
    return new ListHTMLExportNode(node.getListType(), node.getStart(), node.getKey())
  }

  static importJSON(serializedNode: SerializedListNode): ListNode {
    return super.importJSON(serializedNode)
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor)
    if (this.getListType() === 'check' && element instanceof HTMLElement) {
      element.classList.add('Lexical__checkList')
    }
    return { element }
  }

  exportJSON(): SerializedListHTMLExportNode {
    return {
      ...super.exportJSON(),
      type: 'list-html-export',
    }
  }
}
