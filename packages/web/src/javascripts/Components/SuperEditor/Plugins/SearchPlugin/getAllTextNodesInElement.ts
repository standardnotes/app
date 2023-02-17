export const getAllTextNodesInElement = (element: HTMLElement) => {
  const textNodes: Text[] = []
  const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  let node = walk.nextNode()
  while (node) {
    textNodes.push(node as Text)
    node = walk.nextNode()
  }
  return textNodes
}
