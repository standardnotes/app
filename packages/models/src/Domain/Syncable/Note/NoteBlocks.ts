import { NoteType } from '@standardnotes/features'

export type NoteBlock = {
  id: string
  type: NoteType
  editorIdentifier: string
  content: string
  size?: { width: number; height: number }
}

export interface NoteBlocks {
  blocks: NoteBlock[]
}
