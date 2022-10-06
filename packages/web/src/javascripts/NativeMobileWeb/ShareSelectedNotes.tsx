import { WebApplication } from '@/Application/Application'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { parseFileName } from '@standardnotes/filepicker'
import { SNNote } from '@standardnotes/snjs'
import { sanitizeFileName } from '@standardnotes/ui-services'
import { shareBlobOnMobile } from './ShareBlobOnMobile'

export const shareSelectedNotes = async (application: WebApplication, notes: SNNote[]) => {
  if (!application.isNativeMobileWeb()) {
    throw new Error('Share function being used outside mobile webview')
  }
  if (notes.length === 1) {
    const note = notes[0]
    const blob = getNoteBlob(application, note)
    const { name, ext } = parseFileName(getNoteFileName(application, note))
    const filename = `${sanitizeFileName(name)}.${ext}`
    void shareBlobOnMobile(application, blob, filename)
    return
  }
  if (notes.length > 1) {
    const zippedDataBlob = await application.getArchiveService().zipData(
      notes.map((note) => {
        return {
          name: getNoteFileName(application, note),
          content: getNoteBlob(application, note),
        }
      }),
    )
    void shareBlobOnMobile(
      application,
      zippedDataBlob,
      `Standard Notes Export - ${application.getArchiveService().formattedDateForExports()}.zip`,
    )
  }
}
