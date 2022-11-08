import type { DOMConversionOutput, LexicalNode } from 'lexical'

import { FileNode } from './FileNode'

export function convertToFileElement(domNode: HTMLDivElement): DOMConversionOutput | null {
  const fileUuid = domNode.getAttribute('data-lexical-file-uuid')
  if (fileUuid) {
    const node = $createFileNode(fileUuid)
    return { node }
  }
  return null
}

export function $createFileNode(fileUuid: string): FileNode {
  return new FileNode(fileUuid)
}

export function $isFileNode(node: FileNode | LexicalNode | null | undefined): node is FileNode {
  return node instanceof FileNode
}
