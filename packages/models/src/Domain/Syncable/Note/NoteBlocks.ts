export type NoteBlock = {
  id: string
  content: string
  previewPlain: string
  previewHtml?: string
  type: BlockType
  componentIdentifier?: string
  size?: { width: number; height: number }
}

export enum BlockType {
  Plaintext,
  Component,
  Quote,
}

export interface NoteBlocks {
  blocks: NoteBlock[]
}

export type BlockValues = {
  content: string
  previewPlain: string
  previewHtml?: string
}
