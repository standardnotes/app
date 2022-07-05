import { EncryptAndUploadFileOperation } from '../Operations/EncryptAndUpload'
import { FileItem, FileMetadata } from '@standardnotes/models'
import { ClientDisplayableError } from '@standardnotes/responses'
import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { FileSystemApi, FileBackupMetadataFile, FileHandleRead, FileSystemNoSelection } from '@standardnotes/services'

export interface FilesClientInterface {
  beginNewFileUpload(sizeInBytes: number): Promise<EncryptAndUploadFileOperation | ClientDisplayableError>

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
    onDecryptedBytes: (bytes: Uint8Array, progress: FileDownloadProgress | undefined) => Promise<void>,
  ): Promise<ClientDisplayableError | undefined>

  deleteFile(file: FileItem): Promise<ClientDisplayableError | undefined>

  minimumChunkSize(): number

  isFileNameFileBackupRelated(name: string): 'metadata' | 'binary' | false

  decryptBackupMetadataFile(metdataFile: FileBackupMetadataFile): Promise<FileItem | undefined>

  selectFile(fileSystem: FileSystemApi): Promise<FileHandleRead | FileSystemNoSelection>

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
