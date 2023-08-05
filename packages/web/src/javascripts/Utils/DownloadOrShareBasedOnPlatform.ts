import { downloadBlobOnAndroid } from '@/NativeMobileWeb/DownloadBlobOnAndroid'
import { shareBlobOnMobile } from '@/NativeMobileWeb/ShareBlobOnMobile'
import { MobileDeviceInterface, Platform } from '@standardnotes/snjs'
import { ArchiveManager } from '@standardnotes/ui-services'

export const downloadOrShareBlobBasedOnPlatform = async (dto: {
  archiveService: ArchiveManager
  platform: Platform
  mobileDevice: MobileDeviceInterface | undefined
  blob: Blob
  filename: string
  isNativeMobileWeb: boolean
  showToastOnAndroid?: boolean
}) => {
  if (!dto.isNativeMobileWeb) {
    dto.archiveService.downloadData(dto.blob, dto.filename)
    return
  }

  if (dto.mobileDevice && dto.platform === Platform.Ios) {
    void shareBlobOnMobile(dto.mobileDevice, dto.isNativeMobileWeb, dto.blob, dto.filename)
    return
  }

  if (dto.mobileDevice && dto.platform === Platform.Android) {
    void downloadBlobOnAndroid(dto.mobileDevice, dto.blob, dto.filename, dto.showToastOnAndroid ?? true)
    return
  }
}
