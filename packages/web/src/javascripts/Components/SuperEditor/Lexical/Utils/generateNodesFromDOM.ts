/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { $isElementNode, DOMChildConversion, DOMConversion, DOMConversionFn, LexicalEditor, LexicalNode } from 'lexical'

/**
 * How you parse your html string to get a document is left up to you. In the browser you can use the native
 * DOMParser API to generate a document (see clipboard.ts), but to use in a headless environment you can use JSDom
 * or an equivilant library and pass in the document here.
 */
export function $generateNodesFromDOM(editor: LexicalEditor, dom: Document): Array<LexicalNode> {
  let lexicalNodes: Array<LexicalNode> = []
  const elements: Array<Node> = dom.body ? Array.from(dom.body.childNodes) : []
  const elementsLength = elements.length

  for (let i = 0; i < elementsLength; i++) {
    const element = elements[i]

    if (!IGNORE_TAGS.has(element.nodeName)) {
      console.log(element)
      const lexicalNode = $createNodesFromDOM(element, editor)

      if (lexicalNode !== null) {
        lexicalNodes = lexicalNodes.concat(lexicalNode)
      }
    }
  }

  return lexicalNodes
}

function getConversionFunction(domNode: Node, editor: LexicalEditor): DOMConversionFn | null {
  const { nodeName } = domNode

  const cachedConversions = editor._htmlConversions.get(nodeName.toLowerCase())

  let currentConversion: DOMConversion | null = null

  if (cachedConversions !== undefined) {
    for (const cachedConversion of cachedConversions) {
      const domConversion = cachedConversion(domNode)

      if (
        domConversion !== null &&
        (currentConversion === null || currentConversion.priority < domConversion.priority)
      ) {
        currentConversion = domConversion
      }
    }
  }

  return currentConversion !== null ? currentConversion.conversion : null
}

const IGNORE_TAGS = new Set(['STYLE', 'SCRIPT'])

function $createNodesFromDOM(
  node: Node,
  editor: LexicalEditor,
  forChildMap: Map<string, DOMChildConversion> = new Map(),
  parentLexicalNode?: LexicalNode | null | undefined,
  preformatted = false,
): Array<LexicalNode> {
  let lexicalNodes: Array<LexicalNode> = []

  if (IGNORE_TAGS.has(node.nodeName)) {
    return lexicalNodes
  }

  let currentLexicalNode = null
  const transformFunction = getConversionFunction(node, editor)
  const transformOutput = transformFunction ? transformFunction(node as HTMLElement, undefined, preformatted) : null
  let postTransform = null

  if (transformOutput !== null) {
    postTransform = transformOutput.after
    currentLexicalNode = transformOutput.node

    if (currentLexicalNode !== null) {
      for (const [, forChildFunction] of forChildMap) {
        currentLexicalNode = forChildFunction(currentLexicalNode, parentLexicalNode)

        if (!currentLexicalNode) {
          break
        }
      }

      if (currentLexicalNode) {
        lexicalNodes.push(currentLexicalNode)
      }
    }

    if (transformOutput.forChild != null) {
      forChildMap.set(node.nodeName, transformOutput.forChild)
    }
  }

  // If the DOM node doesn't have a transformer, we don't know what
  // to do with it but we still need to process any childNodes.
  const children = node.childNodes
  let childLexicalNodes = []

  for (let i = 0; i < children.length; i++) {
    childLexicalNodes.push(
      ...$createNodesFromDOM(
        children[i],
        editor,
        new Map(forChildMap),
        currentLexicalNode,
        preformatted || (transformOutput && transformOutput.preformatted) === true,
      ),
    )
  }

  if (postTransform != null) {
    childLexicalNodes = postTransform(childLexicalNodes)
  }

  if (currentLexicalNode == null) {
    // If it hasn't been converted to a LexicalNode, we hoist its children
    // up to the same level as it.
    lexicalNodes = lexicalNodes.concat(childLexicalNodes)
  } else {
    if ($isElementNode(currentLexicalNode)) {
      // If the current node is a ElementNode after conversion,
      // we can append all the children to it.
      currentLexicalNode.append(...childLexicalNodes)
    }
  }

  return lexicalNodes
}
