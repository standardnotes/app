import { SuperEditorMetadata } from '@/Constants/Constants'
import { NoteType } from '@standardnotes/features'
import { IconType } from '@standardnotes/models'

export function getIconAndTintForNoteType(noteType?: NoteType, subtle?: boolean): [IconType, number] {
  switch (noteType) {
    case undefined:
    case NoteType.Plain:
      return ['plain-text', 1]
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
      return [
        subtle ? (SuperEditorMetadata.subtleIcon as IconType) : SuperEditorMetadata.icon,
        SuperEditorMetadata.iconTintNumber,
      ]
    case NoteType.Unknown:
    default:
      return ['editor', 1]
  }
}
