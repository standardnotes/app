import { StartUploadSessionResponse, MinimalHttpResponse, ClientDisplayableError } from '@standardnotes/responses'
import { FileContent } from '@standardnotes/models'

export interface FilesApiInterface {
  startUploadSession(apiToken: string): Promise<StartUploadSessionResponse>

  uploadFileBytes(apiToken: string, chunkId: number, encryptedBytes: Uint8Array): Promise<boolean>

  closeUploadSession(apiToken: string): Promise<boolean>

  downloadFile(
    file: { encryptedChunkSizes: FileContent['encryptedChunkSizes'] },
    chunkIndex: number,
    apiToken: string,
    contentRangeStart: number,
    onBytesReceived: (bytes: Uint8Array) => Promise<void>,
  ): Promise<ClientDisplayableError | undefined>

  deleteFile(apiToken: string): Promise<MinimalHttpResponse>

  createFileValetToken(
    remoteIdentifier: string,
    operation: 'write' | 'read' | 'delete',
    unencryptedFileSize?: number,
  ): Promise<string | ClientDisplayableError>

  getFilesDownloadUrl(): string
}
