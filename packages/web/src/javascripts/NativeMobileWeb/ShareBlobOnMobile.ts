import { WebApplication } from '@/Application/Application'
import { getBase64FromBlob } from '@/Utils'

export const shareBlobOnMobile = async (application: WebApplication, blob: Blob, filename: string) => {
  if (!application.isNativeMobileWeb()) {
    throw new Error('Share function being used outside mobile webview')
  }
  const base64 = await getBase64FromBlob(blob)
  application.mobileDevice.shareBase64AsFile(base64, filename)
}
