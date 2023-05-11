import { StartUploadSessionResponse, HttpResponse, ClientDisplayableError } from '@standardnotes/responses'
import { FileContent } from '@standardnotes/models'

export type DownloadFileParams = {
  file: { encryptedChunkSizes: FileContent['encryptedChunkSizes'] }
  chunkIndex: number
  valetToken: string
  isSharedDownload?: boolean
  contentRangeStart: number
  onBytesReceived: (bytes: Uint8Array) => Promise<void>
}

export interface FilesApiInterface {
  startUploadSession(apiToken: string): Promise<HttpResponse<StartUploadSessionResponse>>

  uploadFileBytes(apiToken: string, chunkId: number, encryptedBytes: Uint8Array): Promise<boolean>

  closeUploadSession(apiToken: string): Promise<boolean>

  downloadFile(params: DownloadFileParams): Promise<ClientDisplayableError | undefined>

  deleteFile(apiToken: string): Promise<HttpResponse>

  createFileValetToken(
    remoteIdentifier: string,
    operation: 'write' | 'read' | 'delete',
    unencryptedFileSize?: number,
  ): Promise<string | ClientDisplayableError>

  getFilesDownloadUrl(sharedFile?: boolean): string
}
