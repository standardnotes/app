import { WebApplication } from '@/Application/Application'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { parseFileName } from '@standardnotes/filepicker'
import { Platform, SNNote } from '@standardnotes/snjs'
import { sanitizeFileName } from '@standardnotes/ui-services'
import { downloadBlobOnAndroid } from './DownloadBlobOnAndroid'

export const downloadSelectedNotesOnAndroid = async (application: WebApplication, notes: SNNote[]) => {
  if (!application.isNativeMobileWeb() || application.platform !== Platform.Android) {
    throw new Error('Function being used on non-android platform')
  }
  if (notes.length === 1) {
    const note = notes[0]
    const blob = getNoteBlob(application, note)
    const { name, ext } = parseFileName(getNoteFileName(application, note))
    const filename = `${sanitizeFileName(name)}.${ext}`
    await downloadBlobOnAndroid(application, blob, filename)
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
    const filename = `Standard Notes Export - ${application.getArchiveService().formattedDateForExports()}.zip`
    await downloadBlobOnAndroid(application, zippedDataBlob, filename)
  }
}
