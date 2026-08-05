import { getBase64FromBlob } from '@/Utils'
import { MobileDeviceInterface } from '@standardnotes/snjs'
import { sanitizeFileNameForNativeWrite } from '@standardnotes/utils'
import { addToast, ToastType, dismissToast } from '@standardnotes/toast'
import { c } from 'ttag'

const jtString = (value: unknown): string => (Array.isArray(value) ? value.join('') : String(value))

export const downloadBlobOnAndroid = async (
  mobileDevice: MobileDeviceInterface,
  blob: Blob,
  filename: string,
  showToast = true,
) => {
  const safeFilename = sanitizeFileNameForNativeWrite(filename)
  let loadingToastId: string | undefined
  if (showToast) {
    loadingToastId = addToast({
      type: ToastType.Loading,
      message: jtString(c('B8.MobileDesktopShared.Mobile.Info').jt`Downloading ${safeFilename}..`),
    })
  }
  const base64 = await getBase64FromBlob(blob)
  const downloaded = await mobileDevice.downloadBase64AsFile(base64, safeFilename)
  if (loadingToastId) {
    dismissToast(loadingToastId)
  }
  if (!showToast) {
    return
  }
  if (downloaded) {
    addToast({
      type: ToastType.Success,
      message: jtString(c('B8.MobileDesktopShared.Mobile.Info').jt`Downloaded ${safeFilename}`),
    })
  } else {
    addToast({
      type: ToastType.Error,
      message: jtString(c('B8.MobileDesktopShared.Mobile.Error').jt`Could not download ${safeFilename}`),
    })
  }
}
