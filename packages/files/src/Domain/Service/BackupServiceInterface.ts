import { OnChunkCallback } from '../Chunker/OnChunkCallback'
import { DesktopWatchedDirectoriesChanges } from '../Device/DesktopWatchedChanges'
import { FileBackupRecord } from '../Device/FileBackupsMapping'
import { SuperConverterServiceInterface } from './SuperConverterServiceInterface'

export interface BackupServiceInterface {
  openAllDirectoriesContainingBackupFiles(): void
  prependWorkspacePathForPath(path: string): Promise<string>
  importWatchedDirectoryChanges(changes: DesktopWatchedDirectoriesChanges): Promise<void>
  setSuperConverter(converter: SuperConverterServiceInterface): void

  getFileBackupInfo(file: { uuid: string }): Promise<FileBackupRecord | undefined>
  readEncryptedFileFromBackup(uuid: string, onChunk: OnChunkCallback): Promise<'success' | 'failed' | 'aborted'>
  isFilesBackupsEnabled(): boolean
  enableFilesBackups(): Promise<void>
  disableFilesBackups(): void
  changeFilesBackupsLocation(): Promise<string | undefined>
  getFilesBackupsLocation(): string | undefined
  openFilesBackupsLocation(): Promise<void>
  openFileBackup(record: FileBackupRecord): Promise<void>
  getFileBackupAbsolutePath(record: FileBackupRecord): Promise<string>

  isTextBackupsEnabled(): boolean
  enableTextBackups(): Promise<void>
  disableTextBackups(): void
  getTextBackupsLocation(): string | undefined
  openTextBackupsLocation(): Promise<void>
  changeTextBackupsLocation(): Promise<string | undefined>
  saveTextBackupData(data: string): Promise<void>

  isPlaintextBackupsEnabled(): boolean
  enablePlaintextBackups(): Promise<void>
  disablePlaintextBackups(): void
  getPlaintextBackupsLocation(): string | undefined
  openPlaintextBackupsLocation(): Promise<void>
  changePlaintextBackupsLocation(): Promise<string | undefined>
}
