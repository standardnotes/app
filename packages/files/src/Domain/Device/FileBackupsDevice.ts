import { Uuid } from '@standardnotes/common'
import { FileBackupsMapping } from './FileBackupsMapping'

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
