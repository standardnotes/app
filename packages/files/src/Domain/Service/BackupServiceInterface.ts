import { OnChunkCallback } from '../Chunker/OnChunkCallback'
import { FileBackupRecord } from '../Device/FileBackupsMapping'

export interface BackupServiceInterface {
  getFileBackupInfo(file: { uuid: string }): Promise<FileBackupRecord | undefined>
  readFileFromBackup(uuid: string, onChunk: OnChunkCallback): Promise<'success' | 'failed' | 'aborted'>
}
