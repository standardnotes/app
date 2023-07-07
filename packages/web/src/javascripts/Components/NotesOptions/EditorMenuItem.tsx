import { ComponentOrNativeFeature, NoteType } from '@standardnotes/snjs'

export type EditorMenuItem = {
  name: string
  component?: ComponentOrNativeFeature
  isEntitled: boolean
  noteType: NoteType
  isLabs?: boolean
  description?: string
}
