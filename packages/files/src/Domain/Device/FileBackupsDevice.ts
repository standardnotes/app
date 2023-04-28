import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { FileBackupRecord, FileBackupsMapping } from './FileBackupsMapping'

export type FileBackupReadToken = string
export type FileBackupReadChunkResponse = { chunk: Uint8Array; isLast: boolean; progress: FileDownloadProgress }

export interface FileBackupsDevice {
  getFilesBackupsMappingFile(): Promise<FileBackupsMapping>
  saveFilesBackupsFile(
    uuid: string,
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
  getFilesBackupsLocation(): Promise<string | undefined>
  openFilesBackupsLocation(): Promise<void>
  openFileBackup(record: FileBackupRecord): Promise<void>

  isTextBackupsEnabled(): Promise<boolean>
  enableTextBackups(): Promise<void>
  disableTextBackups(): Promise<void>
  getTextBackupsLocation(): Promise<string | undefined>
  changeTextBackupsLocation(): Promise<string | undefined>
  openTextBackupsLocation(): Promise<void>
  getTextBackupsCount(): Promise<number>
  performTextBackup(): Promise<void>
  deleteTextBackups(): Promise<void>
  saveTextBackupData(data: unknown): void
}
