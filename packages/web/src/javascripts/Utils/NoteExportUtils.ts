import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { NoteType, PrefKey, SNNote, PrefDefaults, FileItem } from '@standardnotes/snjs'
import { WebApplicationInterface, sanitizeFileName } from '@standardnotes/ui-services'

export const getNoteFormat = (application: WebApplicationInterface, note: SNNote) => {
  if (note.noteType === NoteType.Super) {
    const superNoteExportFormatPref = application.getPreference(
      PrefKey.SuperNoteExportFormat,
      PrefDefaults[PrefKey.SuperNoteExportFormat],
    )

    return superNoteExportFormatPref
  }

  const editor = application.componentManager.editorForNote(note)
  return editor.fileType
}

export const getNoteFileName = (application: WebApplicationInterface, note: SNNote): string => {
  const format = getNoteFormat(application, note)
  return `${note.title}.${format}`
}

const headlessSuperConverter = new HeadlessSuperConverter()

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
    note.noteType === NoteType.Super
      ? headlessSuperConverter.convertSuperStringToOtherFormat(note.text, format)
      : note.text
  const blob = new Blob([content], {
    type,
  })
  return blob
}

const isSuperNote = (note: SNNote) => {
  return note.noteType === NoteType.Super
}

const superNoteHasEmbeddedFiles = (note: SNNote) => {
  return isSuperNote(note) && note.text.includes('"type":"snfile"')
}

export const exportNotes = async (application: WebApplication, notes: SNNote[]) => {
  if (notes.length === 0) {
    return
  }
  if (notes.length === 1 && (!isSuperNote(notes[0]) || !superNoteHasEmbeddedFiles(notes[0]))) {
    const blob = getNoteBlob(application, notes[0])
    const fileName = getNoteFileName(application, notes[0])
    application.archiveService.downloadData(blob, fileName)
    return
  }

  const zip = await import('@zip.js/zip.js')
  const zipFS = new zip.fs.FS()
  const { root } = zipFS

  if (notes.length === 1 && superNoteHasEmbeddedFiles(notes[0])) {
    const blob = getNoteBlob(application, notes[0])
    const fileName = getNoteFileName(application, notes[0])
    root.addBlob(fileName, blob)

    try {
      const embeddedFileIDs = headlessSuperConverter.getEmbeddedFileIDsFromSuperString(notes[0].text)
      for (const embeddedFileID of embeddedFileIDs) {
        const fileItem = application.items.findItem<FileItem>(embeddedFileID)
        if (!fileItem) {
          continue
        }
        const embeddedFileBlob = await application.filesController.getFileBlob(fileItem)
        if (!embeddedFileBlob) {
          continue
        }
        root.addBlob(sanitizeFileName(fileItem.title), embeddedFileBlob)
      }
    } catch (error) {
      console.error(error)
    }

    const zippedBlob = await zipFS.exportBlob()
    application.archiveService.downloadData(zippedBlob, `${sanitizeFileName(fileName)}.zip`)
    return
  }

  for (const note of notes) {
    const blob = getNoteBlob(application, note)
    const fileName = getNoteFileName(application, note)

    if (note.noteType !== NoteType.Super) {
      root.addBlob(fileName, blob)
      continue
    }
  }

  const zippedBlob = await zipFS.exportBlob()
  application.archiveService.downloadData(
    zippedBlob,
    `Standard Notes Export - ${application.archiveService.formattedDateForExports()}.zip`,
  )
}
