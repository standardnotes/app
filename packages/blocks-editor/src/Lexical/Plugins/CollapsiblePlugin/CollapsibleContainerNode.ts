/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  DOMConversionMap,
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
} from 'lexical';

type SerializedCollapsibleContainerNode = Spread<
  {
    type: 'collapsible-container';
    version: 1;
    open: boolean;
  },
  SerializedElementNode
>;

export class CollapsibleContainerNode extends ElementNode {
  __open: boolean;

  constructor(open: boolean, key?: NodeKey) {
    super(key);
    this.__open = open ?? false;
  }

  static override getType(): string {
    return 'collapsible-container';
  }

  static override clone(
    node: CollapsibleContainerNode,
  ): CollapsibleContainerNode {
    return new CollapsibleContainerNode(node.__open, node.__key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('details');
    dom.classList.add('Collapsible__container');
    dom.open = this.__open;
    return dom;
  }

  override updateDOM(
    prevNode: CollapsibleContainerNode,
    dom: HTMLDetailsElement,
  ): boolean {
    if (prevNode.__open !== this.__open) {
      dom.open = this.__open;
    }

    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {};
  }

  static override importJSON(
    serializedNode: SerializedCollapsibleContainerNode,
  ): CollapsibleContainerNode {
    const node = $createCollapsibleContainerNode(serializedNode.open);
    return node;
  }

  override exportJSON(): SerializedCollapsibleContainerNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-container',
      version: 1,
      open: this.__open,
    };
  }

  setOpen(open: boolean): void {
    const writable = this.getWritable();
    writable.__open = open;
  }

  getOpen(): boolean {
    return this.__open;
  }

  toggleOpen(): void {
    this.setOpen(!this.getOpen());
  }
}

export function $createCollapsibleContainerNode(
  open: boolean,
): CollapsibleContainerNode {
  return new CollapsibleContainerNode(open);
}

export function $isCollapsibleContainerNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleContainerNode {
  return node instanceof CollapsibleContainerNode;
}
