import { LoggingDomain, log } from './../../../Logging'
import {
  FileBackupsDevice,
  FileBackupsMapping,
  FileBackupReadToken,
  FileBackupReadChunkResponse,
  PlaintextBackupsMapping,
  DesktopWatchedDirectoriesChange,
} from '@web/Application/Device/DesktopSnjsExports'
import { AppState } from 'app/AppState'
import { promises as fs, existsSync } from 'fs'
import { WebContents } from 'electron'
import { StoreKeys } from '../Store/StoreKeys'
import path from 'path'
import { FileDownloader } from './FileDownloader'
import { FileReadOperation } from './FileReadOperation'
import { Paths } from '../Types/Paths'
import { MessageToWebApp } from '../../Shared/IpcMessages'
import { FilesManagerInterface } from '../File/FilesManagerInterface'

const TextBackupFileExtension = '.txt'

export const FileBackupsConstantsV1 = {
  Version: '1.0.0',
  MetadataFileName: 'metadata.sn.json',
  BinaryFileName: 'file.encrypted',
}

export class FilesBackupManager implements FileBackupsDevice {
  private readOperations: Map<string, FileReadOperation> = new Map()
  private plaintextMappingCache?: PlaintextBackupsMapping

  constructor(
    private appState: AppState,
    private webContents: WebContents,
    private filesManager: FilesManagerInterface,
  ) {}

  private async findUuidForPlaintextBackupFileName(
    backupsDirectory: string,
    targetFilename: string,
  ): Promise<string | undefined> {
    const mapping = await this.getPlaintextBackupsMappingFile(backupsDirectory)

    const uuid = Object.keys(mapping.files).find((uuid) => {
      const entries = mapping.files[uuid]
      for (const entry of entries) {
        const filePath = entry.path
        const filename = path.basename(filePath)
        if (filename === targetFilename) {
          return true
        }
      }
      return false
    })

    return uuid
  }

  async joinPaths(...paths: string[]): Promise<string> {
    return path.join(...paths)
  }

  public async migrateLegacyFileBackupsToNewStructure(newLocation: string): Promise<void> {
    const legacyLocation = await this.getLegacyFilesBackupsLocation()
    if (!legacyLocation) {
      return
    }

    await this.filesManager.ensureDirectoryExists(newLocation)

    const legacyMappingLocation = path.join(legacyLocation, 'info.json')
    const newMappingLocation = this.getFileBackupsMappingFilePath(newLocation)
    await this.filesManager.ensureDirectoryExists(path.dirname(newMappingLocation))
    if (existsSync(legacyMappingLocation)) {
      await this.filesManager.moveFile(legacyMappingLocation, newMappingLocation)
    }

    await this.filesManager.moveDirContents(legacyLocation, newLocation)
  }

  public async isLegacyFilesBackupsEnabled(): Promise<boolean> {
    return this.appState.store.get(StoreKeys.LegacyFileBackupsEnabled)
  }

  async wasLegacyTextBackupsExplicitlyDisabled(): Promise<boolean> {
    const value = this.appState.store.get(StoreKeys.LegacyTextBackupsDisabled)
    return value === true
  }

  async getUserDocumentsDirectory(): Promise<string | undefined> {
    return Paths.documentsDir
  }

  public async getLegacyFilesBackupsLocation(): Promise<string | undefined> {
    return this.appState.store.get(StoreKeys.LegacyFileBackupsLocation)
  }

  async getLegacyTextBackupsLocation(): Promise<string | undefined> {
    const savedLocation = this.appState.store.get(StoreKeys.LegacyTextBackupsLocation)
    if (savedLocation) {
      return savedLocation
    }

    const LegacyTextBackupsDirectory = 'Standard Notes Backups'
    const homeDir = Paths.homeDir
    if (homeDir) {
      return path.join(homeDir, LegacyTextBackupsDirectory)
    }

    return undefined
  }

  private getFileBackupsMappingFilePath(backupsLocation: string): string {
    return path.join(backupsLocation, '.settings', 'info.json')
  }

  private async getFileBackupsMappingFileFromDisk(backupsLocation: string): Promise<FileBackupsMapping | undefined> {
    return this.filesManager.readJSONFile<FileBackupsMapping>(this.getFileBackupsMappingFilePath(backupsLocation))
  }

  private defaulFileBackupstMappingFileValue(): FileBackupsMapping {
    return { version: FileBackupsConstantsV1.Version, files: {} }
  }

  async getFilesBackupsMappingFile(backupsLocation: string): Promise<FileBackupsMapping> {
    const data = await this.getFileBackupsMappingFileFromDisk(backupsLocation)

    if (!data) {
      return this.defaulFileBackupstMappingFileValue()
    }

    for (const entry of Object.values(data.files)) {
      entry.backedUpOn = new Date(entry.backedUpOn)
    }

    return data
  }

  private async saveFilesBackupsMappingFile(location: string, file: FileBackupsMapping): Promise<'success' | 'failed'> {
    await this.filesManager.writeJSONFile(this.getFileBackupsMappingFilePath(location), file)

    return 'success'
  }

  async saveFilesBackupsFile(
    location: string,
    uuid: string,
    metaFile: string,
    downloadRequest: {
      chunkSizes: number[]
      valetToken: string
      url: string
    },
  ): Promise<'success' | 'failed'> {
    const fileDir = path.join(location, uuid)
    const metaFilePath = path.join(fileDir, FileBackupsConstantsV1.MetadataFileName)
    const binaryPath = path.join(fileDir, FileBackupsConstantsV1.BinaryFileName)

    await this.filesManager.ensureDirectoryExists(fileDir)

    await this.filesManager.writeFile(metaFilePath, metaFile)

    const downloader = new FileDownloader(
      downloadRequest.chunkSizes,
      downloadRequest.valetToken,
      downloadRequest.url,
      binaryPath,
    )

    const result = await downloader.run()

    if (result === 'success') {
      const mapping = await this.getFilesBackupsMappingFile(location)

      mapping.files[uuid] = {
        backedUpOn: new Date(),
        relativePath: uuid,
        metadataFileName: FileBackupsConstantsV1.MetadataFileName,
        binaryFileName: FileBackupsConstantsV1.BinaryFileName,
        version: FileBackupsConstantsV1.Version,
      }

      await this.saveFilesBackupsMappingFile(location, mapping)
    }

    return result
  }

  async getFileBackupReadToken(filePath: string): Promise<FileBackupReadToken> {
    const operation = new FileReadOperation(filePath)

    this.readOperations.set(operation.token, operation)

    return operation.token
  }

  async readNextChunk(token: string): Promise<FileBackupReadChunkResponse> {
    const operation = this.readOperations.get(token)

    if (!operation) {
      return Promise.reject(new Error('Invalid token'))
    }

    const result = await operation.readNextChunk()

    if (result.isLast) {
      this.readOperations.delete(token)
    }

    return result
  }

  async getTextBackupsCount(location: string): Promise<number> {
    let files = await fs.readdir(location)
    files = files.filter((fileName) => fileName.endsWith(TextBackupFileExtension))
    return files.length
  }

  async saveTextBackupData(location: string, data: string): Promise<void> {
    log(LoggingDomain.Backups, 'Saving text backup data', 'to', location)
    let success: boolean

    try {
      await this.filesManager.ensureDirectoryExists(location)
      const name = `${new Date().toISOString().replace(/:/g, '-')}${TextBackupFileExtension}`
      const filePath = path.join(location, name)
      await fs.writeFile(filePath, data)
      success = true
    } catch (err) {
      success = false
      console.error('An error occurred saving backup file', err)
    }

    log(LoggingDomain.Backups, 'Finished saving text backup data', { success })
  }

  async copyDecryptScript(location: string) {
    try {
      await this.filesManager.ensureDirectoryExists(location)
      await fs.copyFile(Paths.decryptScript, path.join(location, path.basename(Paths.decryptScript)))
    } catch (error) {
      console.error(error)
    }
  }

  private getPlaintextMappingFilePath(location: string): string {
    return path.join(location, '.settings', 'info.json')
  }

  private async getPlaintextMappingFileFromDisk(location: string): Promise<PlaintextBackupsMapping | undefined> {
    return this.filesManager.readJSONFile<PlaintextBackupsMapping>(this.getPlaintextMappingFilePath(location))
  }

  private async savePlaintextBackupsMappingFile(
    location: string,
    file: PlaintextBackupsMapping,
  ): Promise<'success' | 'failed'> {
    await this.filesManager.writeJSONFile(this.getPlaintextMappingFilePath(location), file)

    return 'success'
  }

  private defaultPlaintextMappingFileValue(): PlaintextBackupsMapping {
    return { version: '1.0', files: {} }
  }

  async getPlaintextBackupsMappingFile(location: string): Promise<PlaintextBackupsMapping> {
    if (this.plaintextMappingCache) {
      return this.plaintextMappingCache
    }

    let data = await this.getPlaintextMappingFileFromDisk(location)

    if (!data) {
      data = this.defaultPlaintextMappingFileValue()
    }

    this.plaintextMappingCache = data

    return data
  }

  async savePlaintextNoteBackup(
    location: string,
    uuid: string,
    name: string,
    tags: string[],
    data: string,
  ): Promise<void> {
    log(LoggingDomain.Backups, 'Saving plaintext note backup', uuid, 'to', location)

    const mapping = await this.getPlaintextBackupsMappingFile(location)
    if (!mapping.files[uuid]) {
      mapping.files[uuid] = []
    }

    const removeNoteFromAllDirectories = async () => {
      const records = mapping.files[uuid]
      for (const record of records) {
        const filePath = path.join(location, record.path)
        await this.filesManager.deleteFileIfExists(filePath)
      }
      mapping.files[uuid] = []
    }

    await removeNoteFromAllDirectories()

    const writeFileToPath = async (absolutePath: string, filename: string, data: string, forTag?: string) => {
      const findMappingRecord = (tag?: string) => {
        const records = mapping.files[uuid]
        return records.find((record) => record.tag === tag)
      }

      await this.filesManager.ensureDirectoryExists(absolutePath)

      const relativePath = forTag ?? ''
      const filenameWithSlashesEscaped = filename.replace(/\//g, '\u2215')
      const fileAbsolutePath = path.join(absolutePath, relativePath, filenameWithSlashesEscaped)
      await this.filesManager.writeFile(fileAbsolutePath, data)

      const existingRecord = findMappingRecord(forTag)
      if (!existingRecord) {
        mapping.files[uuid].push({
          tag: forTag,
          path: path.join(relativePath, filename),
        })
      } else {
        existingRecord.path = path.join(relativePath, filename)
        existingRecord.tag = forTag
      }
    }

    const uuidPart = uuid.split('-')[0]
    const condensedUuidPart = uuidPart.substring(0, 4)
    if (tags.length === 0) {
      await writeFileToPath(location, `${name}-${condensedUuidPart}.txt`, data)
    } else {
      for (const tag of tags) {
        await writeFileToPath(location, `${name}-${condensedUuidPart}.txt`, data, tag)
      }
    }
  }

  async persistPlaintextBackupsMappingFile(location: string): Promise<void> {
    if (!this.plaintextMappingCache) {
      return
    }

    await this.savePlaintextBackupsMappingFile(location, this.plaintextMappingCache)
  }

  async monitorPlaintextBackupsLocationForChanges(backupsDirectory: string): Promise<void> {
    const FEATURE_ENABLED = false
    if (!FEATURE_ENABLED) {
      return
    }

    try {
      const watcher = fs.watch(backupsDirectory, { recursive: true })
      for await (const event of watcher) {
        const { eventType, filename } = event
        if (!filename) {
          continue
        }

        if (eventType !== 'change' && eventType !== 'rename') {
          continue
        }
        const itemUuid = await this.findUuidForPlaintextBackupFileName(backupsDirectory, filename)
        if (itemUuid) {
          try {
            const change: DesktopWatchedDirectoriesChange = {
              itemUuid,
              path: path.join(backupsDirectory, filename),
              type: eventType,
              content: await fs.readFile(path.join(backupsDirectory, filename), 'utf-8'),
            }
            this.webContents.send(MessageToWebApp.WatchedDirectoriesChanges, [change])
          } catch (err) {
            log(LoggingDomain.Backups, 'Error processing watched change', err)
            continue
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return
      }
      throw err
    }
  }
}
