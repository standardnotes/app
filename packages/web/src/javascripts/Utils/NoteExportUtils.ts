import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { NoteType, PrefKey, SNNote, getComponentOrNativeFeatureFileType, PrefDefaults } from '@standardnotes/snjs'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export const getNoteFormat = (application: WebApplicationInterface, note: SNNote) => {
  const editor = application.componentManager.editorForNote(note)

  const isSuperNote = note.noteType === NoteType.Super

  if (isSuperNote) {
    const superNoteExportFormatPref = application.getPreference(
      PrefKey.SuperNoteExportFormat,
      PrefDefaults[PrefKey.SuperNoteExportFormat],
    )

    return superNoteExportFormatPref
  }

  if (editor) {
    return getComponentOrNativeFeatureFileType(editor) ?? 'txt'
  }

  return 'txt'
}

export const getNoteFileName = (application: WebApplicationInterface, note: SNNote): string => {
  const format = getNoteFormat(application, note)
  return `${note.title}.${format}`
}

export const getNoteBlob = (application: WebApplicationInterface, note: SNNote) => {
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
