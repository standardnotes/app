import { Uuid } from '@standardnotes/common'
import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { FileBackupRecord, FileBackupsMapping } from './FileBackupsMapping'

export type FileBackupReadToken = string
export type FileBackupReadChunkResponse = { chunk: Uint8Array; isLast: boolean; progress: FileDownloadProgress }

export interface FileBackupsDevice {
  getFilesBackupsMappingFile(): Promise<FileBackupsMapping>
  saveFilesBackupsFile(
    uuid: Uuid,
    metaFile: string,
    downloadRequest: {
      chunkSizes: number[]
      valetToken: string
      url: string
    },
  ): Promise<'success' | 'failed'>
  getFileBackupReadToken(record: FileBackupRecord): Promise<FileBackupReadToken>
  readNextChunk(token: string): Promise<FileBackupReadChunkResponse>
  isFilesBackupsEnabled(): Promise<boolean>
  enableFilesBackups(): Promise<void>
  disableFilesBackups(): Promise<void>
  changeFilesBackupsLocation(): Promise<string | undefined>
  getFilesBackupsLocation(): Promise<string>
  openFilesBackupsLocation(): Promise<void>
  openFileBackup(record: FileBackupRecord): Promise<void>
}
