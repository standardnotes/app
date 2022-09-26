import { WebApplication } from '@/Application/Application'
import { getBase64FromBlob } from '@/Utils'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { parseFileName } from '@standardnotes/filepicker'
import { Platform, SNNote } from '@standardnotes/snjs'
import { addToast, dismissToast, ToastType } from '@standardnotes/toast'
import { sanitizeFileName } from '@standardnotes/ui-services'

export const downloadSelectedItemsOnAndroid = async (application: WebApplication, notes: SNNote[]) => {
  if (!application.isNativeMobileWeb() || application.platform !== Platform.Android) {
    throw new Error('Function being used on non-android platform')
  }
  if (notes.length === 1) {
    const note = notes[0]
    const blob = getNoteBlob(application, note)
    const base64 = await getBase64FromBlob(blob)
    const { name, ext } = parseFileName(getNoteFileName(application, note))
    const filename = `${sanitizeFileName(name)}.${ext}`
    const loadingToastId = addToast({
      type: ToastType.Loading,
      message: `Exporting ${filename}..`,
    })
    const downloaded = await application.mobileDevice.downloadBase64AsFileOnAndroid(base64, filename)
    if (downloaded) {
      dismissToast(loadingToastId)
      addToast({
        type: ToastType.Success,
        message: `Exported ${filename}`,
      })
    } else {
      addToast({
        type: ToastType.Error,
        message: `Could not export ${filename}`,
      })
    }
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
    const filename = `Standard Notes Export - ${application.getArchiveService().formattedDateForExports()}.zip`
    const loadingToastId = addToast({
      type: ToastType.Loading,
      message: `Exporting ${filename}..`,
    })
    const downloaded = await application.mobileDevice.downloadBase64AsFileOnAndroid(zippedDataAsBase64, filename)
    if (downloaded) {
      dismissToast(loadingToastId)
      addToast({
        type: ToastType.Success,
        message: `Exported ${filename}`,
      })
    } else {
      addToast({
        type: ToastType.Error,
        message: `Could not export ${filename}`,
      })
    }
  }
}
