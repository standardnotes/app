import { FileBackupRecord, OnChunkCallback } from '@standardnotes/files'

export interface BackupServiceInterface {
  getFileBackupInfo(file: { uuid: string }): Promise<FileBackupRecord | undefined>
  readFileFromBackup(uuid: string, onChunk: OnChunkCallback): Promise<'success' | 'failed' | 'aborted'>
}
