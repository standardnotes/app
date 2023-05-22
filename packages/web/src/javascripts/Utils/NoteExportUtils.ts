import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { NoteType, PrefKey, SNNote } from '@standardnotes/snjs'

export const getNoteFormat = (application: WebApplication, note: SNNote) => {
  const editor = application.componentManager.editorForNote(note)

  const isSuperNote = note.noteType === NoteType.Super

  if (isSuperNote) {
    const superNoteExportFormatPref = application.getPreference(
      PrefKey.SuperNoteExportFormat,
      PrefDefaults[PrefKey.SuperNoteExportFormat],
    )

    return superNoteExportFormatPref
  }

  return editor?.package_info?.file_type || 'txt'
}

export const getNoteFileName = (application: WebApplication, note: SNNote): string => {
  const format = getNoteFormat(application, note)
  return `${note.title}.${format}`
}

export const getNoteBlob = (application: WebApplication, note: SNNote) => {
  const format = getNoteFormat(application, note)
  let type: string
  switch (format) {
    case 'html':
      type = 'text/html'
      break
    case 'json':
      type = 'application/json'
      break
    case 'md':
      type = 'text/markdown'
      break
    default:
      type = 'text/plain'
      break
  }
  const content =
    note.noteType === NoteType.Super ? new HeadlessSuperConverter().convertString(note.text, format) : note.text
  const blob = new Blob([content], {
    type,
  })
  return blob
}
