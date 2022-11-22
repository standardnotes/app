import { Uuid } from '@standardnotes/common'
import { FileBackupsConstantsV1 } from './FileBackupsConstantsV1'

export type FileBackupRecord = {
  backedUpOn: Date
  absolutePath: string
  relativePath: string
  metadataFileName: typeof FileBackupsConstantsV1.MetadataFileName
  binaryFileName: typeof FileBackupsConstantsV1.BinaryFileName
  version: typeof FileBackupsConstantsV1.Version
}

export interface FileBackupsMapping {
  version: typeof FileBackupsConstantsV1.Version
  files: Record<Uuid, FileBackupRecord>
}
