import { OnChunkCallback } from '../Chunker/OnChunkCallback'
import { FileBackupRecord } from '../Device/FileBackupsMapping'

export interface BackupServiceInterface {
  openAllDirectoriesContainingBackupFiles(): void

  getFileBackupInfo(file: { uuid: string }): Promise<FileBackupRecord | undefined>
  readEncryptedFileFromBackup(uuid: string, onChunk: OnChunkCallback): Promise<'success' | 'failed' | 'aborted'>
  isFilesBackupsEnabled(): boolean
  enableFilesBackups(): void
  disableFilesBackups(): void
  changeFilesBackupsLocation(): Promise<string | undefined>
  getFilesBackupsLocation(): string | undefined
  openFilesBackupsLocation(): Promise<void>
  openFileBackup(record: FileBackupRecord): Promise<void>

  isTextBackupsEnabled(): boolean
  enableTextBackups(): void
  disableTextBackups(): void
  getTextBackupsLocation(): string | undefined
  openTextBackupsLocation(): Promise<void>
  changeTextBackupsLocation(): Promise<string | undefined>
  saveTextBackupData(data: string): Promise<void>

  isPlaintextBackupsEnabled(): boolean
  enablePlaintextBackups(): void
  disablePlaintextBackups(): void
  getPlaintextBackupsLocation(): string | undefined
  openPlaintextBackupsLocation(): Promise<void>
  changePlaintextBackupsLocation(): Promise<string | undefined>
}
