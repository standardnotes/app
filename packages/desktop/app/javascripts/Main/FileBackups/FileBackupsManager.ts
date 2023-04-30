import { LoggingDomain, log } from './../../../Logging'
import {
  FileBackupRecord,
  FileBackupsDevice,
  FileBackupsMapping,
  FileBackupReadToken,
  FileBackupReadChunkResponse,
  PlaintextBackupsMapping,
} from '@web/Application/Device/DesktopSnjsExports'
import { AppState } from 'app/AppState'
import { promises as fs } from 'fs'
import { shell } from 'electron'
import { StoreKeys } from '../Store/StoreKeys'
import path from 'path'
import {
  ensureDirectoryExists,
  moveDirContents,
  openDirectoryPicker,
  readJSONFile,
  writeFile,
  writeJSONFile,
} from '../Utils/FileUtils'
import { FileDownloader } from './FileDownloader'
import { FileReadOperation } from './FileReadOperation'
import { Paths } from '../Types/Paths'

const TextBackupFileExtension = '.txt'

export const FileBackupsConstantsV1 = {
  Version: '1.0.0',
  MetadataFileName: 'metadata.sn.json',
  BinaryFileName: 'file.encrypted',
}

export class FilesBackupManager implements FileBackupsDevice {
  private readOperations: Map<string, FileReadOperation> = new Map()
  private plaintextMappingCache?: PlaintextBackupsMapping

  constructor(private appState: AppState) {}

  public async isLegacyFilesBackupsEnabled(): Promise<boolean> {
    return this.appState.store.get(StoreKeys.LegacyFileBackupsEnabled)
  }

  async isLegacyTextBackupsEnabled(): Promise<boolean> {
    const value = this.appState.store.get(StoreKeys.LegacyTextBackupsDisabled)
    if (value == undefined) {
      return false
    }
    return !value
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
    return `${Paths.homeDir}/${LegacyTextBackupsDirectory}`
  }

  public async presentDirectoryPickerForLocationChangeAndTransferOld(
    appendPath: string,
    oldLocation?: string,
  ): Promise<string | undefined> {
    const selectedDirectory = await openDirectoryPicker('Select')

    if (!selectedDirectory) {
      return undefined
    }

    const newPath = path.join(selectedDirectory, path.normalize(appendPath))

    if (oldLocation) {
      await moveDirContents(path.normalize(oldLocation), newPath)
    }

    return newPath
  }

  private getMappingFilePath(backupsLocation: string): string {
    return `${backupsLocation}/info.json`
  }

  private async getMappingFileFromDisk(backupsLocation: string): Promise<FileBackupsMapping | undefined> {
    return readJSONFile<FileBackupsMapping>(this.getMappingFilePath(backupsLocation))
  }

  private defaultMappingFileValue(): FileBackupsMapping {
    return { version: FileBackupsConstantsV1.Version, files: {} }
  }

  async getFilesBackupsMappingFile(backupsLocation: string): Promise<FileBackupsMapping> {
    const data = await this.getMappingFileFromDisk(backupsLocation)

    if (!data) {
      return this.defaultMappingFileValue()
    }

    for (const entry of Object.values(data.files)) {
      entry.backedUpOn = new Date(entry.backedUpOn)
    }

    return data
  }

  async openLocation(location: string): Promise<void> {
    void shell.openPath(location)
  }

  async openFileBackup(record: FileBackupRecord): Promise<void> {
    void shell.openPath(record.absolutePath)
  }

  private async saveFilesBackupsMappingFile(location: string, file: FileBackupsMapping): Promise<'success' | 'failed'> {
    await writeJSONFile(this.getMappingFilePath(location), file)

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
    const backupsDir = await this.getLegacyFilesBackupsLocation()

    const fileDir = `${backupsDir}/${uuid}`
    const metaFilePath = `${fileDir}/${FileBackupsConstantsV1.MetadataFileName}`
    const binaryPath = `${fileDir}/${FileBackupsConstantsV1.BinaryFileName}`

    await ensureDirectoryExists(fileDir)

    await writeFile(metaFilePath, metaFile)

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
        absolutePath: fileDir,
        relativePath: uuid,
        metadataFileName: FileBackupsConstantsV1.MetadataFileName,
        binaryFileName: FileBackupsConstantsV1.BinaryFileName,
        version: FileBackupsConstantsV1.Version,
      }

      await this.saveFilesBackupsMappingFile(location, mapping)
    }

    return result
  }

  async getFileBackupReadToken(record: FileBackupRecord): Promise<FileBackupReadToken> {
    const operation = new FileReadOperation(record)

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
      await ensureDirectoryExists(location)
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
      await ensureDirectoryExists(location)
      await fs.copyFile(Paths.decryptScript, path.join(location, path.basename(Paths.decryptScript)))
    } catch (error) {
      console.error(error)
    }
  }

  private getPlaintextMappingFilePath(location: string): string {
    return `${location}/info.json`
  }

  private async getPlaintextMappingFileFromDisk(location: string): Promise<PlaintextBackupsMapping | undefined> {
    return readJSONFile<PlaintextBackupsMapping>(this.getPlaintextMappingFilePath(location))
  }

  private async savePlaintextBackupsMappingFile(
    location: string,
    file: PlaintextBackupsMapping,
  ): Promise<'success' | 'failed'> {
    await writeJSONFile(this.getPlaintextMappingFilePath(location), file)

    return 'success'
  }

  private defaultPlaintextMappingFileValue(): PlaintextBackupsMapping {
    return { version: '1.0', files: {} }
  }

  async getPlaintextBackupsMappingFile(location: string): Promise<PlaintextBackupsMapping> {
    if (this.plaintextMappingCache) {
      return this.plaintextMappingCache
    }

    const data = await this.getPlaintextMappingFileFromDisk(location)

    if (!data) {
      return this.defaultPlaintextMappingFileValue()
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
        await fs.unlink(filePath)
      }
    }

    await removeNoteFromAllDirectories()

    const writeFileToPath = async (absolutePath: string, filename: string, data: string, forTag?: string) => {
      const findMappingRecord = (tag?: string) => {
        const records = mapping.files[uuid]
        return records.find((record) => record.tag === tag)
      }

      await ensureDirectoryExists(absolutePath)

      const relativePath = forTag ?? ''
      const filenameWithSlashesEscaped = filename.replace(/\//g, '\u2215')
      const fileAbsolutePath = path.join(absolutePath, relativePath, filenameWithSlashesEscaped)
      await writeFile(fileAbsolutePath, data)

      const existingRecord = findMappingRecord(forTag)
      if (!existingRecord) {
        mapping.files[uuid].push({
          tag: forTag,
          path: path.join(relativePath, filename),
        })
      }
    }

    if (tags.length === 0) {
      await writeFileToPath(location, `${name}.txt`, data)
    } else {
      for (const tag of tags) {
        await writeFileToPath(location, `${name}.txt`, data, tag)
      }
    }
  }

  async persistPlaintextBackupsMappingFile(location: string): Promise<void> {
    if (!this.plaintextMappingCache) {
      return
    }

    await this.savePlaintextBackupsMappingFile(location, this.plaintextMappingCache)
  }
}
