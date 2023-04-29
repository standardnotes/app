import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { FileBackupRecord, FileBackupsMapping } from './FileBackupsMapping'

export type FileBackupReadToken = string
export type FileBackupReadChunkResponse = { chunk: Uint8Array; isLast: boolean; progress: FileDownloadProgress }

type PlaintextNoteRecord = {
  tag?: string
  path: string
}

export type PlaintextBackupsMapping = {
  version: string
  /** A note or tag uuid maps to an array of PlaintextNoteRecord */
  files: Record<string, PlaintextNoteRecord[]>
}

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
  deleteTextBackups(): Promise<void>
  saveTextBackupData(workspaceId: string, data: unknown): Promise<void>

  getPlaintextBackupsMappingFile(): Promise<PlaintextBackupsMapping>
  persistPlaintextBackupsMappingFile(): Promise<void>
  isPlaintextBackupsEnabled(): Promise<boolean>
  enablePlaintextBackups(): Promise<void>
  disablePlaintextBackups(): Promise<void>
  getPlaintextBackupsLocation(): Promise<string | undefined>
  changePlaintextBackupsLocation(): Promise<string | undefined>
  openPlaintextBackupsLocation(): Promise<void>
  savePlaintextNoteBackup(workspaceId: string, uuid: string, name: string, tags: string[], data: string): Promise<void>
}
