/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical'

type SerializedCollapsibleContainerNode = Spread<
  {
    open: boolean
  },
  SerializedElementNode
>

export function convertDetailsElement(domNode: HTMLDetailsElement): DOMConversionOutput | null {
  const isOpen = domNode.open !== undefined ? domNode.open : true
  const node = $createCollapsibleContainerNode(isOpen)
  return {
    node,
  }
}

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean

  constructor(open: boolean, key?: NodeKey) {
    super(key)
    this.__open = open ?? false
  }

  static override clone(node: CollapsibleContainerNode): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key)
  }

  static override getType(): string {
    return 'collapsible-container'
  }

  override createDOM(_: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('details')
    dom.classList.add('Collapsible__container')
    dom.open = this.__open
    dom.addEventListener('toggle', () => {
      const open = editor.getEditorState().read(() => this.getOpen())
      if (open !== dom.open) {
        editor.update(() => this.toggleOpen())
      }
    })
    return dom
  }

  override updateDOM(prevNode: CollapsibleContainerNode, dom: HTMLDetailsElement): boolean {
    if (prevNode.__open !== this.__open) {
      dom.open = this.__open
    }

    return false
  }

  static importDOM(): DOMConversionMap<HTMLDetailsElement> | null {
    return {
      details: () => {
        return {
          conversion: convertDetailsElement,
          priority: 1,
        }
      },
    }
  }

  static override importJSON(serializedNode: SerializedCollapsibleContainerNode): CollapsibleContainerNode {
    return $createCollapsibleContainerNode(serializedNode.open).updateFromJSON(serializedNode)
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('details')
    if (this.getLatest().__open) {
      element.setAttribute('open', '')
    }
    return { element }
  }

  override exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      open: this.__open,
    }
  }

  setOpen(open: boolean): void {
    const writable = this.getWritable()
    writable.__open = open
  }

  getOpen(): boolean {
    return this.__open
  }

  toggleOpen(): void {
    this.setOpen(!this.getOpen())
  }
}

export function $createCollapsibleContainerNode(open: boolean): CollapsibleContainerNode {
  return new CollapsibleContainerNode(open)
}

export function $isCollapsibleContainerNode(node: LexicalNode | null | undefined): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode
}
