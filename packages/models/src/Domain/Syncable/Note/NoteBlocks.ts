import { NoteType } from '@standardnotes/features'

export type NoteBlock = {
  id: string
  type: NoteType
  editorIdentifier: string
  size?: { width: number; height: number }
}

type StringLocation = { start: number; end: number }

type BlockStringIndices = {
  open: StringLocation
  content: StringLocation
  close: StringLocation
}

export interface NoteBlocks {
  blocks: NoteBlock[]
}

export function bracketSyntaxForBlock(block: { id: NoteBlock['id'] }): { open: string; close: string } {
  return {
    open: `<Block id=${block.id}>`,
    close: `</Block id=${block.id}>`,
  }
}

export function stringIndicesForBlock(text: string, block: { id: NoteBlock['id'] }): BlockStringIndices | undefined {
  const brackets = bracketSyntaxForBlock(block)

  const startIndex = text.indexOf(brackets.open)
  if (startIndex === -1) {
    return undefined
  }
  const startOfEndTag = text.indexOf(brackets.close, startIndex)
  if (startOfEndTag === -1) {
    return undefined
  }

  const open = { start: startIndex, end: startIndex + brackets.open.length - 1 }

  const close =
    startOfEndTag === -1
      ? { start: -1, end: -1 }
      : { start: startOfEndTag, end: startOfEndTag + brackets.close.length - 1 }

  const content = close.start === open.end + 1 ? { start: -1, end: -1 } : { start: open.end + 1, end: close.start - 1 }

  return {
    open,
    content,
    close,
  }
}

export function createBlockTextWithSyntaxAndContent(
  block: { id: NoteBlock['id'] },
  content: string,
  blockIndex: number,
  addingPadding: boolean,
): string {
  const brackets = bracketSyntaxForBlock(block)
  const padding = !addingPadding ? '' : blockIndex === 0 ? '' : '\n\n'

  return `${padding}${brackets.open}\n${content}\n${brackets.close}`
}
