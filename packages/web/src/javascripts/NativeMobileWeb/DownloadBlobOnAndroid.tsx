import { WebApplication } from '@/Application/Application'
import { getBase64FromBlob } from '@/Utils'
import { Platform } from '@standardnotes/snjs'
import { addToast, ToastType, dismissToast } from '@standardnotes/toast'

export const downloadBlobOnAndroid = async (
  application: WebApplication,
  blob: Blob,
  filename: string,
  showToast = true,
) => {
  if (!application.isNativeMobileWeb() || application.platform !== Platform.Android) {
    throw new Error('Download function being used on non-android platform')
  }
  let loadingToastId: string | undefined
  if (showToast) {
    loadingToastId = addToast({
      type: ToastType.Loading,
      message: `Downloading ${filename}..`,
    })
  }
  const base64 = await getBase64FromBlob(blob)
  const downloaded = await application.mobileDevice().downloadBase64AsFile(base64, filename)
  if (loadingToastId) {
    dismissToast(loadingToastId)
  }
  if (!showToast) {
    return
  }
  if (downloaded) {
    addToast({
      type: ToastType.Success,
      message: `Downloaded ${filename}`,
    })
  } else {
    addToast({
      type: ToastType.Error,
      message: `Could not download ${filename}`,
    })
  }
}
