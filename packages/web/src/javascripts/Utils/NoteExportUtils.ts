import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'

export const getNoteFormat = (application: WebApplication, note: SNNote) => {
  const editor = application.componentManager.editorForNote(note)
  const format = editor?.package_info?.file_type || 'txt'
  return format
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
  const blob = new Blob([note.text], {
    type,
  })
  return blob
}
