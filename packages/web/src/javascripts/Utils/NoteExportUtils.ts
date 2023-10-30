import { WebApplication } from '@/Application/WebApplication'
import { HeadlessSuperConverter } from '@/Components/SuperEditor/Tools/HeadlessSuperConverter'
import { NoteType, PrefKey, SNNote, PrefDefaults, FileItem, PrefValue } from '@standardnotes/snjs'
import { WebApplicationInterface, sanitizeFileName } from '@standardnotes/ui-services'
import { ZipDirectoryEntry } from '@zip.js/zip.js'

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

// @ts-expect-error Using inline loaders to load CSS as string
import superEditorCSS from '!css-loader!sass-loader!../Components/SuperEditor/Lexical/Theme/editor.scss'
// @ts-expect-error Using inline loaders to load CSS as string
import snColorsCSS from '!css-loader!sass-loader!@standardnotes/styles/src/Styles/_colors.scss'
// @ts-expect-error Using inline loaders to load CSS as string
import exportOverridesCSS from '!css-loader!sass-loader!../Components/SuperEditor/Lexical/Theme/export-overrides.scss'

const superHTML = (note: SNNote, content: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${note.title}</title>
    <style>
      ${snColorsCSS.toString()}
      ${superEditorCSS.toString()}
      ${exportOverridesCSS.toString()}
    </style>
  </head>
  <body>
    ${content}
  </body>
</html>
`

const superMarkdown = (note: SNNote, content: string) => `---
title: ${note.title}
created_at: ${note.created_at.toISOString()}
updated_at: ${note.serverUpdatedAt.toISOString()}
uuid: ${note.uuid}
---

${content}
`

export const getNoteBlob = (
  application: WebApplicationInterface,
  note: SNNote,
  superEmbedBehavior: PrefValue[PrefKey.SuperNoteExportEmbedBehavior],
) => {
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
  if (note.noteType === NoteType.Super) {
    const content = headlessSuperConverter.convertSuperStringToOtherFormat(note.text, format, {
      embedBehavior: superEmbedBehavior,
      getFileItem: (id) => application.items.findItem<FileItem>(id),
    })
    const useMDFrontmatter =
      format === 'md' &&
      application.getPreference(
        PrefKey.SuperNoteExportUseMDFrontmatter,
        PrefDefaults[PrefKey.SuperNoteExportUseMDFrontmatter],
      )
    const result =
      format === 'html' ? superHTML(note, content) : useMDFrontmatter ? superMarkdown(note, content) : content
    const blob = new Blob([result], {
      type,
    })
    return blob
  }
  const blob = new Blob([note.text], {
    type,
  })
  return blob
}

const isSuperNote = (note: SNNote) => {
  return note.noteType === NoteType.Super
}

const noteHasEmbeddedFiles = (note: SNNote) => {
  return note.text.includes('"type":"snfile"')
}

const noteRequiresFolder = (
  note: SNNote,
  superExportFormat: PrefValue[PrefKey.SuperNoteExportFormat],
  superEmbedBehavior: PrefValue[PrefKey.SuperNoteExportEmbedBehavior],
) => {
  if (!isSuperNote(note)) {
    return false
  }
  if (superExportFormat === 'json') {
    return false
  }
  if (superEmbedBehavior !== 'separate') {
    return false
  }
  return noteHasEmbeddedFiles(note)
}

const addEmbeddedFilesToFolder = async (application: WebApplication, note: SNNote, folder: ZipDirectoryEntry) => {
  try {
    const embeddedFileIDs = headlessSuperConverter.getEmbeddedFileIDsFromSuperString(note.text)
    for (const embeddedFileID of embeddedFileIDs) {
      const fileItem = application.items.findItem<FileItem>(embeddedFileID)
      if (!fileItem) {
        continue
      }
      const embeddedFileBlob = await application.filesController.getFileBlob(fileItem)
      if (!embeddedFileBlob) {
        continue
      }
      folder.addBlob(sanitizeFileName(fileItem.title), embeddedFileBlob)
    }
  } catch (error) {
    console.error(error)
  }
}

export const exportNotes = async (application: WebApplication, notes: SNNote[]) => {
  if (notes.length === 0) {
    return
  }

  const superExportFormatPref = application.getPreference(
    PrefKey.SuperNoteExportFormat,
    PrefDefaults[PrefKey.SuperNoteExportFormat],
  )
  const superEmbedBehaviorPref = application.getPreference(
    PrefKey.SuperNoteExportEmbedBehavior,
    PrefDefaults[PrefKey.SuperNoteExportEmbedBehavior],
  )

  if (notes.length === 1 && !noteRequiresFolder(notes[0], superExportFormatPref, superEmbedBehaviorPref)) {
    const blob = getNoteBlob(application, notes[0], superEmbedBehaviorPref)
    const fileName = getNoteFileName(application, notes[0])
    application.archiveService.downloadData(blob, fileName)
    return
  }

  const zip = await import('@zip.js/zip.js')
  const zipFS = new zip.fs.FS()
  const { root } = zipFS

  if (notes.length === 1 && noteRequiresFolder(notes[0], superExportFormatPref, superEmbedBehaviorPref)) {
    const blob = getNoteBlob(application, notes[0], superEmbedBehaviorPref)
    const fileName = getNoteFileName(application, notes[0])
    root.addBlob(fileName, blob)

    await addEmbeddedFilesToFolder(application, notes[0], root)

    const zippedBlob = await zipFS.exportBlob()
    application.archiveService.downloadData(zippedBlob, `${sanitizeFileName(fileName)}.zip`)
    return
  }

  for (const note of notes) {
    const blob = getNoteBlob(application, note, superEmbedBehaviorPref)
    const fileName = getNoteFileName(application, note)

    if (!noteRequiresFolder(note, superExportFormatPref, superEmbedBehaviorPref)) {
      root.addBlob(fileName, blob)
      continue
    }

    const folder = root.addDirectory(sanitizeFileName(note.title))
    folder.addBlob(fileName, blob)
    await addEmbeddedFilesToFolder(application, note, folder)
  }

  const zippedBlob = await zipFS.exportBlob()
  application.archiveService.downloadData(
    zippedBlob,
    `Standard Notes Export - ${application.archiveService.formattedDateForExports()}.zip`,
  )
}
