/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical'

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import { DecoratorBlockNode, SerializedDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode'

function convertTweetElement(domNode: HTMLDivElement): DOMConversionOutput | null {
  const id = domNode.getAttribute('data-lexical-tweet-id')
  if (id) {
    const node = $createTweetNode(id)
    return { node }
  }
  return null
}

export type SerializedTweetNode = Spread<
  {
    id: string
  },
  SerializedDecoratorBlockNode
>

export class TweetNode extends DecoratorBlockNode {
  __id: string

  static override getType(): string {
    return 'tweet'
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__id = id
  }

  static override clone(node: TweetNode): TweetNode {
    return new TweetNode(node.__id, node.__format, node.__key)
  }

  static override importJSON(serializedNode: SerializedTweetNode): TweetNode {
    return $createTweetNode(serializedNode.id).updateFromJSON(serializedNode)
  }

  override exportJSON(): SerializedTweetNode {
    return {
      ...super.exportJSON(),
      id: this.getId(),
    }
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (!domNode.hasAttribute('data-lexical-tweet-id')) {
          return null
        }
        return {
          conversion: convertTweetElement,
          priority: 2,
        }
      },
    }
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute('data-lexical-tweet-id', this.__id)
    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  getId(): string {
    return this.__id
  }

  override getTextContent(_includeInert?: boolean | undefined, _includeDirectionless?: false | undefined): string {
    return `https://x.com/i/web/status/${this.__id}`
  }

  override decorate(_: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    }
    const link = this.getTextContent()
    return (
      <BlockWithAlignableContents className={className} format={this.__format} nodeKey={this.getKey()}>
        <a href={link} target="_blank" rel="noreferrer noopener">
          {link}
        </a>
      </BlockWithAlignableContents>
    )
  }

  override isInline(): false {
    return false
  }
}

export function $createTweetNode(tweetID: string): TweetNode {
  return new TweetNode(tweetID)
}

export function $isTweetNode(node: TweetNode | LexicalNode | null | undefined): node is TweetNode {
  return node instanceof TweetNode
}
