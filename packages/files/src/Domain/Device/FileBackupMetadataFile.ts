import { BackupFileEncryptedContextualPayload } from '@standardnotes/models'

export interface FileBackupMetadataFile {
  info: Record<string, string>
  file: BackupFileEncryptedContextualPayload
  itemsKey: BackupFileEncryptedContextualPayload
  version: '1.0.0'
}
