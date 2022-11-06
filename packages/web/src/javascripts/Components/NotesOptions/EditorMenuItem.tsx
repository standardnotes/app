import { NoteType, SNComponent } from '@standardnotes/snjs'

export type EditorMenuItem = {
  name: string
  component?: SNComponent
  isEntitled: boolean
  noteType: NoteType
}
