import { getBase64FromBlob } from '@/Utils'
import { MobileDeviceInterface } from '@standardnotes/snjs'

export const shareBlobOnMobile = async (
  mobileDevice: MobileDeviceInterface,
  isNativeMobileWeb: boolean,
  blob: Blob,
  filename: string,
) => {
  if (!isNativeMobileWeb) {
    throw new Error('Share function being used outside mobile webview')
  }
  const base64 = await getBase64FromBlob(blob)
  void mobileDevice.shareBase64AsFile(base64, filename)
}
