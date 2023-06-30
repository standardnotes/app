import {
  StartUploadSessionResponse,
  HttpResponse,
  ClientDisplayableError,
  ValetTokenOperation,
} from '@standardnotes/responses'
import { DownloadFileParams } from './DownloadFileParams'
import { FileOwnershipType } from './FileOwnershipType'

export interface FilesApiInterface {
  createUserFileValetToken(
    remoteIdentifier: string,
    operation: ValetTokenOperation,
    unencryptedFileSize?: number,
  ): Promise<string | ClientDisplayableError>

  startUploadSession(
    valetToken: string,
    ownershipType: FileOwnershipType,
  ): Promise<HttpResponse<StartUploadSessionResponse>>

  uploadFileBytes(
    valetToken: string,
    ownershipType: FileOwnershipType,
    chunkId: number,
    encryptedBytes: Uint8Array,
  ): Promise<boolean>

  closeUploadSession(valetToken: string, ownershipType: FileOwnershipType): Promise<boolean>

  downloadFile(params: DownloadFileParams): Promise<ClientDisplayableError | undefined>

  moveFile(valetToken: string): Promise<boolean>

  deleteFile(valetToken: string, ownershipType: FileOwnershipType): Promise<HttpResponse>

  getFilesDownloadUrl(ownershipType: FileOwnershipType): string
}
