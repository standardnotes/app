import { NoteType } from '@standardnotes/features'

export type NoteBlock = {
  id: string
  type: NoteType
  editorIdentifier: string
  size?: { width: number; height: number }
  content: string
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

export function stringIndexOfBlock(
  text: string,
  block: { id: NoteBlock['id'] },
): { begin: number; end: number } | undefined {
  const brackets = bracketSyntaxForBlock(block)

  const startIndex = text.indexOf(brackets.open)
  if (startIndex === -1) {
    return undefined
  }

  const endIndex = text.indexOf(brackets.close) + brackets.close.length

  return {
    begin: startIndex,
    end: endIndex,
  }
}

export function blockContentToNoteTextRendition(block: { id: NoteBlock['id'] }, content: string): string {
  const brackets = bracketSyntaxForBlock(block)
  return `${brackets.open}${content}${brackets.close}`
}
