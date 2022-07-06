import { NoteType } from '@standardnotes/features'
import { IconType } from '@Lib/Types/IconType'

export class IconsController {
  getIconForFileType(type: string): IconType {
    let iconType: IconType = 'file-other'

    if (type === 'application/pdf') {
      iconType = 'file-pdf'
    }

    if (/word/.test(type)) {
      iconType = 'file-doc'
    }

    if (/powerpoint|presentation/.test(type)) {
      iconType = 'file-ppt'
    }

    if (/excel|spreadsheet/.test(type)) {
      iconType = 'file-xls'
    }

    if (/^image\//.test(type)) {
      iconType = 'file-image'
    }

    if (/^video\//.test(type)) {
      iconType = 'file-mov'
    }

    if (/^audio\//.test(type)) {
      iconType = 'file-music'
    }

    if (/(zip)|([tr]ar)|(7z)/.test(type)) {
      iconType = 'file-zip'
    }

    return iconType
  }

  getIconAndTintForNoteType(noteType?: NoteType): [IconType, number] {
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
      default:
        return ['plain-text', 1]
    }
  }
}
