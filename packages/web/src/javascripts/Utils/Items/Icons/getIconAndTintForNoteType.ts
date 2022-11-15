import { PlainEditorMetadata, SuperEditorMetadata } from '@/Constants/Constants'
import { NoteType } from '@standardnotes/features'
import { IconType } from '@standardnotes/models'

export function getIconAndTintForNoteType(noteType?: NoteType): [IconType, number] {
  switch (noteType) {
    case NoteType.RichText:
      return ['rich-text', 1]
    case NoteType.Markdown:
      return ['markdown', 2]
    case NoteType.Authentication:
      return ['authenticator', 6]
    case NoteType.Spreadsheet:
      return ['spreadsheets', 5]
    case NoteType.Task:
      return ['tasks', 3]
    case NoteType.Code:
      return ['code', 4]
    case NoteType.Super:
      return [SuperEditorMetadata.icon, SuperEditorMetadata.iconTintNumber]
    default:
      return [PlainEditorMetadata.icon, PlainEditorMetadata.iconTintNumber]
  }
}
