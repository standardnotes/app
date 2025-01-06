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
  LexicalNode,
  SerializedElementNode,
  Spread,
} from 'lexical'

type SerializedCollapsibleContentNode = Spread<
  {
    type: 'collapsible-content'
    version: 1
  },
  SerializedElementNode
>

export function convertCollapsibleContentElement(): DOMConversionOutput | null {
  const node = $createCollapsibleContentNode()
  return {
    node,
  }
}

export class CollapsibleContentNode extends ElementNode {
  static override getType(): string {
    return 'collapsible-content'
  }

  static override clone(node: CollapsibleContentNode): CollapsibleContentNode {
    return new CollapsibleContentNode(node.__key)
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div')
    dom.classList.add('Collapsible__content')
    return dom
  }

  override updateDOM(_prevNode: CollapsibleContentNode, _dom: HTMLElement): boolean {
    return false
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-collapsible-content')) {
          return null
        }
        return {
          conversion: convertCollapsibleContentElement,
          priority: 2,
        }
      },
    }
  }

  static override importJSON(serializedNode: SerializedCollapsibleContentNode): CollapsibleContentNode {
    return $createCollapsibleContentNode().updateFromJSON(serializedNode)
  }

  override isShadowRoot(): boolean {
    return true
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-collapsible-content', 'true')
    return { element }
  }

  override exportJSON(): SerializedCollapsibleContentNode {
    return {
      ...super.exportJSON(),
      type: 'collapsible-content',
      version: 1,
    }
  }
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
  return new CollapsibleContentNode()
}

export function $isCollapsibleContentNode(node: LexicalNode | null | undefined): node is CollapsibleContentNode {
  return node instanceof CollapsibleContentNode
}
