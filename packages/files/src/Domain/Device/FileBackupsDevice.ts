import { FileDownloadProgress } from '../Types/FileDownloadProgress'
import { FileBackupsMapping } from './FileBackupsMapping'

type PlaintextNoteRecord = {
  tag?: string
  path: string
}

type UuidString = string
export type PlaintextBackupsMapping = {
  version: string
  files: Record<UuidString, PlaintextNoteRecord[]>
}

export interface FileBackupsDevice
  extends FileBackupsMethods,
    LegacyBackupsMethods,
    PlaintextBackupsMethods,
    TextBackupsMethods {
  joinPaths(...paths: string[]): Promise<string>

  monitorPlaintextBackupsLocationForChanges(backupsDirectory: string): Promise<void>
}

export type FileBackupReadToken = string
export type FileBackupReadChunkResponse = { chunk: Uint8Array; isLast: boolean; progress: FileDownloadProgress }
interface FileBackupsMethods {
  getFilesBackupsMappingFile(location: string): Promise<FileBackupsMapping>
  saveFilesBackupsFile(
    location: string,
    uuid: string,
    metaFile: string,
    downloadRequest: {
      chunkSizes: number[]
      valetToken: string
      url: string
    },
  ): Promise<'success' | 'failed'>
  getFileBackupReadToken(filePath: string): Promise<FileBackupReadToken>
  readNextChunk(token: string): Promise<FileBackupReadChunkResponse>
}

interface PlaintextBackupsMethods {
  getPlaintextBackupsMappingFile(location: string): Promise<PlaintextBackupsMapping>
  persistPlaintextBackupsMappingFile(location: string): Promise<void>
  savePlaintextNoteBackup(location: string, uuid: string, name: string, tags: string[], data: string): Promise<void>
}

interface TextBackupsMethods {
  getTextBackupsCount(location: string): Promise<number>
  saveTextBackupData(location: string, data: string): Promise<void>
  getUserDocumentsDirectory(): Promise<string | undefined>
}

interface LegacyBackupsMethods {
  migrateLegacyFileBackupsToNewStructure(newPath: string): Promise<void>
  isLegacyFilesBackupsEnabled(): Promise<boolean>
  getLegacyFilesBackupsLocation(): Promise<string | undefined>
  wasLegacyTextBackupsExplicitlyDisabled(): Promise<boolean>
  getLegacyTextBackupsLocation(): Promise<string | undefined>
}
