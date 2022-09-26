import { WebApplication } from '@/Application/Application'
import { getBase64FromBlob } from '@/Utils'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { SNNote } from '@standardnotes/snjs'

export const shareSelectedItems = async (application: WebApplication, notes: SNNote[]) => {
  if (!application.isNativeMobileWeb()) {
    throw new Error('Share function being used outside mobile webview')
  }
  if (notes.length === 1) {
    const note = notes[0]
    const blob = getNoteBlob(application, note)
    const base64 = await getBase64FromBlob(blob)
    application.mobileDevice.shareBase64AsFile(base64, note.title)
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
    const zippedDataAsBase64 = await getBase64FromBlob(zippedDataBlob)
    application.mobileDevice.shareBase64AsFile(
      zippedDataAsBase64,
      `Standard Notes Export - ${application.getArchiveService().formattedDateForExports()}.zip`,
    )
  }
}
