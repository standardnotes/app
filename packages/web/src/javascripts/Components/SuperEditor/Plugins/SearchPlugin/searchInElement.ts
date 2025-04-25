/**
 * Searches for a given query in an element and returns `Range`s for all the results.
 *
 * How it works:
 *
 * We traverse every text node in the element using a TreeWalker. Within every node,
 * we loop through each of the characters of both the node text and the search query,
 * trying to match both of the characters.
 *
 * If the node text char matches the query char:
 *
 * - Set start container and offset values if not already existing, meaning we are at
 * the start of a potential result.
 * - If we are at the last char of the query, set the end container and offset values.
 * We have a full match.
 *   - Otherwise, we increment the query char index so that on the next text char it
 *     can be matched.
 * - We keep track of the latest query char index outside the node loop so that we can
 * search for text across nodes.
 *   - If we don't have an end yet, then we store the current query char index so that
 *     we can use it in the next node to continue the result.
 *   - Otherwise, we reset it to -1
 * - Finally if/when we have both start and end container and offsets, we can create a
 * `Range`.
 *
 * If the node text char doesn't match the query char, then we reset all the intermediary
 * state and start again from the next character.
 */
export function searchInElement(element: HTMLElement, searchQuery: string, isCaseSensitive: boolean): Range[] {
  const ranges: Range[] = []

  let query = searchQuery
  if (!query) {
    return ranges
  }

  if (!isCaseSensitive) {
    query = query.toLowerCase()
  }

  const queryLength = query.length

  const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  let node = walk.nextNode()

  let queryCharIndexToContinueFrom = -1

  let startContainer: Node | null = null
  let startOffset = -1

  let endContainer: Node | null = null
  let endOffset = -1

  while (node) {
    let nodeText = node.textContent
    if (!nodeText) {
      node = walk.nextNode()
      continue
    }

    nodeText = isCaseSensitive ? nodeText : nodeText.toLowerCase()

    const nodeTextLength = nodeText.length

    let textCharIndex = 0
    let queryCharIndex = queryCharIndexToContinueFrom > -1 ? queryCharIndexToContinueFrom : 0

    for (; textCharIndex < nodeTextLength; textCharIndex++) {
      const textChar = nodeText[textCharIndex]
      let queryChar = query[queryCharIndex]

      const didMatchCharacters = textChar === queryChar
      if (!didMatchCharacters) {
        startContainer = null
        startOffset = -1

        const currentQueryIndex = queryCharIndex
        queryCharIndex = 0
        queryCharIndexToContinueFrom = -1

        // edge-case: when searching something like `te` if the content has something like `ttest`,
        // the `te` won't match since we will have reset
        const prevQueryChar = currentQueryIndex > 0 ? query[currentQueryIndex - 1] : null
        if (textChar === prevQueryChar) {
          queryCharIndex = currentQueryIndex - 1
          queryChar = prevQueryChar
        } else {
          continue
        }
      }

      if (!startContainer || startOffset === -1) {
        startContainer = node
        startOffset = textCharIndex
      }

      const indexOfLastCharOfQuery = queryLength - 1

      // last char of query, meaning we matched the whole query
      const isLastCharOfQuery = queryCharIndex === indexOfLastCharOfQuery
      if (isLastCharOfQuery) {
        endContainer = node
        const nextIdx = textCharIndex + 1
        endOffset = nextIdx
      }

      // we have a potential start but query is not fully matched yet
      if (queryCharIndex < indexOfLastCharOfQuery && startContainer && startOffset > -1) {
        queryCharIndex++
      }

      // we dont have an end yet so we keep the latest query index so that it
      // can be carried forward to the next node.
      if (queryCharIndex > -1 && startContainer && !endContainer) {
        queryCharIndexToContinueFrom = queryCharIndex
      } else {
        // reset query index since we found the end
        queryCharIndexToContinueFrom = -1
      }

      if (startContainer && startOffset > -1 && endContainer && endOffset > -1) {
        // create range since we have a full match
        const range = new Range()
        range.setStart(startContainer, startOffset)
        range.setEnd(endContainer, endOffset)
        ranges.push(range)

        // start over
        startContainer = null
        startOffset = -1
        endContainer = null
        endOffset = -1
        queryCharIndex = 0
      }
    }

    node = walk.nextNode()
  }

  return ranges
}
