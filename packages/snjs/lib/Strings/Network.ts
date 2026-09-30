import { c } from 'ttag'

export const NetworkStrings = {
  Files: {
    get FailedStartUploadSession() {
      return c('B7.FilesSubscriptionHelp.Files.Error').t`Failed to start an upload session.`
    },
    get FailedCloseUploadSession() {
      return c('B7.FilesSubscriptionHelp.Files.Error').t`Failed to close an upload session.`
    },
    get FailedUploadFileChunk() {
      return c('B7.FilesSubscriptionHelp.Files.Error').t`Failed to upload file chunk.`
    },
    get FailedDownloadFileChunk() {
      return c('B7.FilesSubscriptionHelp.Files.Error').t`Failed to download file chunk.`
    },
    get FailedDeleteFile() {
      return c('B7.FilesSubscriptionHelp.Files.Error').t`Failed to delete file.`
    },
  },
}
