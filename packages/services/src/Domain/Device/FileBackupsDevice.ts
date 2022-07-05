import { Uuid } from '@standardnotes/common'
import { BackupFileEncryptedContextualPayload } from '@standardnotes/models'

/* istanbul ignore file */

export const FileBackupsConstantsV1 = {
  Version: '1.0.0',
  MetadataFileName: 'metadata.sn.json',
  BinaryFileName: 'file.encrypted',
}

export interface FileBackupMetadataFile {
  info: Record<string, string>
  file: BackupFileEncryptedContextualPayload
  itemsKey: BackupFileEncryptedContextualPayload
  version: '1.0.0'
}

export interface FileBackupsMapping {
  version: typeof FileBackupsConstantsV1.Version
  files: Record<
    Uuid,
    {
      backedUpOn: Date
      absolutePath: string
      relativePath: string
      metadataFileName: typeof FileBackupsConstantsV1.MetadataFileName
      binaryFileName: typeof FileBackupsConstantsV1.BinaryFileName
      version: typeof FileBackupsConstantsV1.Version
    }
  >
}

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
  isFilesBackupsEnabled(): Promise<boolean>
  enableFilesBackups(): Promise<void>
  disableFilesBackups(): Promise<void>
  changeFilesBackupsLocation(): Promise<string | undefined>
  getFilesBackupsLocation(): Promise<string>
  openFilesBackupsLocation(): Promise<void>
}
