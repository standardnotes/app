import { WebApplication } from '@/Application/Application'
import { downloadBlobOnAndroid } from '@/NativeMobileWeb/DownloadBlobOnAndroid'
import { shareBlobOnMobile } from '@/NativeMobileWeb/ShareBlobOnMobile'
import { Platform } from '@standardnotes/snjs'

export const downloadOrShareBlobBasedOnPlatform = async (
  application: WebApplication,
  blob: Blob,
  filename: string,
  showToastOnAndroid = true,
) => {
  if (!application.isNativeMobileWeb()) {
    application.getArchiveService().downloadData(blob, filename)
    return
  }

  if (application.platform === Platform.Ios) {
    void shareBlobOnMobile(application, blob, filename)
    return
  }

  if (application.platform === Platform.Android) {
    void downloadBlobOnAndroid(application, blob, filename, showToastOnAndroid)
    return
  }
}
