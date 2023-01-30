import { WebApplication } from '@/Application/Application'
import { exportSuperNote } from '@/Components/NoteView/SuperEditor/SuperNoteExporter'
import { FeatureIdentifier, NoteType, PrefKey, SNNote } from '@standardnotes/snjs'

export const getNoteFormat = (application: WebApplication, note: SNNote) => {
  const editor = application.componentManager.editorForNote(note)
  const identifier = editor
    ? editor.identifier
    : note.noteType === NoteType.Super
    ? FeatureIdentifier.SuperEditor
    : FeatureIdentifier.PlainEditor

  const defaultFormat = editor?.package_info?.file_type || 'txt'
  const preferredFormat = application.getPreference(PrefKey.NoteExportTypes)?.[identifier]

  return preferredFormat || defaultFormat
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
  const content = note.noteType === NoteType.Super ? exportSuperNote(note, format) : note.text
  const blob = new Blob([content], {
    type,
  })
  return blob
}
