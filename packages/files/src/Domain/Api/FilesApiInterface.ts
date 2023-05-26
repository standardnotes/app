import { StartUploadSessionResponse, HttpResponse, ClientDisplayableError } from '@standardnotes/responses'
import { DownloadFileParams } from './DownloadFileParams'
import { DownloadFileType } from './DownloadFileType'

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

  getFilesDownloadUrl(downloadType: DownloadFileType): string
}
