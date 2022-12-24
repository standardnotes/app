/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $createParagraphNode,
  $isElementNode,
  DOMConversionMap,
  EditorConfig,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from 'lexical';

import {$isCollapsibleContainerNode} from './CollapsibleContainerNode';
import {$isCollapsibleContentNode} from './CollapsibleContentNode';

type SerializedCollapsibleTitleNode = Spread<
  {
    type: 'collapsible-title';
    version: 1;
  },
  SerializedElementNode
>;

export class CollapsibleTitleNode extends ElementNode {
  static override getType(): string {
    return 'collapsible-title';
  }

  static override clone(node: CollapsibleTitleNode): CollapsibleTitleNode {
    return new CollapsibleTitleNode(node.__key);
  }

  override createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('summary');
    dom.classList.add('Collapsible__title');
    dom.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      editor.update(() => {
        const containerNode = this.getParentOrThrow();
        if ($isCollapsibleContainerNode(containerNode)) {
          containerNode.toggleOpen();
        }
      });
    };
    return dom;
  }

  override updateDOM(
    prevNode: CollapsibleTitleNode,
    dom: HTMLElement,
  ): boolean {
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {};
  }

  static override importJSON(
    serializedNode: SerializedCollapsibleTitleNode,
  ): CollapsibleTitleNode {
    return $createCollapsibleTitleNode();
  }

  override exportJSON(): SerializedCollapsibleTitleNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-title',
      version: 1,
    };
  }

  override collapseAtStart(_selection: RangeSelection): boolean {
    this.getParentOrThrow().insertBefore(this);
    return true;
  }

  override insertNewAfter(): ElementNode {
    const containerNode = this.getParentOrThrow();

    if (!$isCollapsibleContainerNode(containerNode)) {
      throw new Error(
        'CollapsibleTitleNode expects to be child of CollapsibleContainerNode',
      );
    }

    if (containerNode.getOpen()) {
      const contentNode = this.getNextSibling();
      if (!$isCollapsibleContentNode(contentNode)) {
        throw new Error(
          'CollapsibleTitleNode expects to have CollapsibleContentNode sibling',
        );
      }

      const firstChild = contentNode.getFirstChild();
      if ($isElementNode(firstChild)) {
        return firstChild;
      } else {
        const paragraph = $createParagraphNode();
        contentNode.append(paragraph);
        return paragraph;
      }
    } else {
      const paragraph = $createParagraphNode();
      containerNode.insertAfter(paragraph);
      return paragraph;
    }
  }
}

export function $createCollapsibleTitleNode(): CollapsibleTitleNode {
  return new CollapsibleTitleNode();
}

export function $isCollapsibleTitleNode(
  node: LexicalNode | null | undefined,
): node is CollapsibleTitleNode {
  return node instanceof CollapsibleTitleNode;
}
