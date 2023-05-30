import { EncryptAndUploadFileOperation } from '../Operations/EncryptAndUpload'
import { FileItem, FileMetadata } from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { FileSystemApi } from '../Api/FileSystemApi'
import { FileHandleRead } from '../Api/FileHandleRead'
import { FileSystemNoSelection } from '../Api/FileSystemNoSelection'
import { FileBackupMetadataFile } from '../Device/FileBackupMetadataFile'

export interface FilesClientInterface {
  minimumChunkSize(): number

  beginNewFileUpload(
    sizeInBytes: number,
    vaultUuid?: string,
  ): Promise<EncryptAndUploadFileOperation | ClientDisplayableError>
  pushBytesForUpload(
    operation: EncryptAndUploadFileOperation,
    bytes: Uint8Array,
    chunkId: number,
    isFinalChunk: boolean,
  ): Promise<ClientDisplayableError | undefined>
  finishUpload(
    operation: EncryptAndUploadFileOperation,
    fileMetadata: FileMetadata,
  ): Promise<FileItem | ClientDisplayableError>

  downloadFile(
    file: FileItem,
    onDecryptedBytes: (bytes: Uint8Array, progress: FileDownloadProgress) => Promise<void>,
  ): Promise<ClientDisplayableError | undefined>

  deleteFile(file: FileItem): Promise<ClientDisplayableError | undefined>

  moveFileToVault(file: FileItem, vaultUuid: string): Promise<void | ClientDisplayableError>
  moveFileFromVaultToUser(file: FileItem): Promise<void | ClientDisplayableError>

  selectFile(fileSystem: FileSystemApi): Promise<FileHandleRead | FileSystemNoSelection>

  isFileNameFileBackupRelated(name: string): 'metadata' | 'binary' | false
  decryptBackupMetadataFile(metdataFile: FileBackupMetadataFile): Promise<FileItem | undefined>
  readBackupFileAndSaveDecrypted(
    fileHandle: FileHandleRead,
    file: FileItem,
    fileSystem: FileSystemApi,
  ): Promise<'success' | 'aborted' | 'failed'>
  readBackupFileBytesDecrypted(
    fileHandle: FileHandleRead,
    file: FileItem,
    fileSystem: FileSystemApi,
  ): Promise<Uint8Array>
}
