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
import { WebContents, shell } from 'electron'
import { StoreKeys } from '../Store/StoreKeys'
import path from 'path'
import {
  deleteDirContents,
  deleteFile,
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

const TextBackupsDirectoryName = 'Text Backups'
const TextBackupFileExtension = '.txt'
const PlaintextBackupsDirectoryName = 'Plaintext Backups'

export const FileBackupsConstantsV1 = {
  Version: '1.0.0',
  MetadataFileName: 'metadata.sn.json',
  BinaryFileName: 'file.encrypted',
}

export class FilesBackupManager implements FileBackupsDevice {
  private readOperations: Map<string, FileReadOperation> = new Map()
  private plaintextMappingCache?: PlaintextBackupsMapping

  constructor(private appState: AppState, private webContents: WebContents) {}

  public async isFilesBackupsEnabled(): Promise<boolean> {
    return this.appState.store.get(StoreKeys.FileBackupsEnabled)
  }

  public async enableFilesBackups(): Promise<void> {
    const currentLocation = await this.getFilesBackupsLocation()

    if (!currentLocation) {
      const result = await this.changeFilesBackupsLocation()

      if (!result) {
        return
      }
    }

    this.appState.store.set(StoreKeys.FileBackupsEnabled, true)

    const mapping = this.getMappingFileFromDisk()

    if (!mapping) {
      await this.saveFilesBackupsMappingFile(this.defaultMappingFileValue())
    }
  }

  public async disableFilesBackups(): Promise<void> {
    this.appState.store.set(StoreKeys.FileBackupsEnabled, false)
  }

  public async changeFilesBackupsLocation(): Promise<string | undefined> {
    const newPath = await openDirectoryPicker('Select')

    if (!newPath) {
      return undefined
    }

    const oldPath = await this.getFilesBackupsLocation()

    if (oldPath) {
      await this.transferFilesBackupsToNewLocation(oldPath, newPath)
    }

    this.appState.store.set(StoreKeys.FileBackupsLocation, newPath)

    return newPath
  }

  private async transferFilesBackupsToNewLocation(oldPath: string, newPath: string): Promise<void> {
    const mapping = await this.getMappingFileFromDisk()
    if (!mapping) {
      return
    }

    const entries = Object.values(mapping.files)
    for (const entry of entries) {
      const sourcePath = path.join(oldPath, entry.relativePath)
      const destinationPath = path.join(newPath, entry.relativePath)
      await moveDirContents(sourcePath, destinationPath)
    }

    for (const entry of entries) {
      entry.absolutePath = path.join(newPath, entry.relativePath)
    }

    const oldMappingFileLocation = this.getMappingFileLocation()

    this.appState.store.set(StoreKeys.FileBackupsLocation, newPath)

    const result = await this.saveFilesBackupsMappingFile(mapping)

    if (result === 'success') {
      await deleteFile(oldMappingFileLocation)
    }
  }

  public async getFilesBackupsLocation(): Promise<string | undefined> {
    return this.appState.store.get(StoreKeys.FileBackupsLocation)
  }

  private getMappingFileLocation(): string {
    const base = this.appState.store.get(StoreKeys.FileBackupsLocation)
    return `${base}/info.json`
  }

  private async getMappingFileFromDisk(): Promise<FileBackupsMapping | undefined> {
    return readJSONFile<FileBackupsMapping>(this.getMappingFileLocation())
  }

  private defaultMappingFileValue(): FileBackupsMapping {
    return { version: FileBackupsConstantsV1.Version, files: {} }
  }

  async getFilesBackupsMappingFile(): Promise<FileBackupsMapping> {
    const data = await this.getMappingFileFromDisk()

    if (!data) {
      return this.defaultMappingFileValue()
    }

    for (const entry of Object.values(data.files)) {
      entry.backedUpOn = new Date(entry.backedUpOn)
    }

    return data
  }

  async openFilesBackupsLocation(): Promise<void> {
    const location = await this.getFilesBackupsLocation()
    if (!location) {
      return
    }

    void shell.openPath(location)
  }

  async openFileBackup(record: FileBackupRecord): Promise<void> {
    void shell.openPath(record.absolutePath)
  }

  private async saveFilesBackupsMappingFile(file: FileBackupsMapping): Promise<'success' | 'failed'> {
    await writeJSONFile(this.getMappingFileLocation(), file)

    return 'success'
  }

  async saveFilesBackupsFile(
    uuid: string,
    metaFile: string,
    downloadRequest: {
      chunkSizes: number[]
      valetToken: string
      url: string
    },
  ): Promise<'success' | 'failed'> {
    const backupsDir = await this.getFilesBackupsLocation()

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
      const mapping = await this.getFilesBackupsMappingFile()

      mapping.files[uuid] = {
        backedUpOn: new Date(),
        absolutePath: fileDir,
        relativePath: uuid,
        metadataFileName: FileBackupsConstantsV1.MetadataFileName,
        binaryFileName: FileBackupsConstantsV1.BinaryFileName,
        version: FileBackupsConstantsV1.Version,
      }

      await this.saveFilesBackupsMappingFile(mapping)
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

  async isTextBackupsEnabled(): Promise<boolean> {
    return !this.appState.store.get(StoreKeys.TextBackupsDisabled)
  }

  async enableTextBackups(): Promise<void> {
    this.appState.store.set(StoreKeys.TextBackupsDisabled, false)
  }

  async disableTextBackups(): Promise<void> {
    this.appState.store.set(StoreKeys.TextBackupsDisabled, true)
  }

  async getTextBackupsLocation(): Promise<string | undefined> {
    const directory = this.appState.store.get(StoreKeys.TextBackupsLocation) ?? (await this.getFilesBackupsLocation())

    if (!directory) {
      const defaultLocation = Paths.documentsDir
      return `${defaultLocation}/Standard Notes/${TextBackupsDirectoryName}`
    }

    return `${directory}/${TextBackupsDirectoryName}`
  }

  async getTextBackupsCount(): Promise<number> {
    const location = await this.getTextBackupsLocation()
    if (!location) {
      return 0
    }

    let files = await fs.readdir(location)
    files = files.filter((fileName) => fileName.endsWith(TextBackupsDirectoryName))
    return files.length
  }

  async deleteTextBackups(): Promise<void> {
    const location = await this.getTextBackupsLocation()
    if (!location) {
      return
    }

    await deleteDirContents(location)

    await this.copyDecryptScript(location)
  }

  async saveTextBackupData(workspaceId: string, data: unknown): Promise<void> {
    const baseBackupsLocation = await this.getTextBackupsLocation()
    log(LoggingDomain.Backups, 'Saving text backup data to', baseBackupsLocation)

    if (!baseBackupsLocation || !(await this.isTextBackupsEnabled())) {
      return
    }

    const workspaceBackupLocation = path.join(baseBackupsLocation, workspaceId)

    let success: boolean

    try {
      await ensureDirectoryExists(workspaceBackupLocation)
      const name = `${new Date().toISOString().replace(/:/g, '-')}${TextBackupFileExtension}`
      const filePath = path.join(workspaceBackupLocation, name)
      await fs.writeFile(filePath, data as any)
      success = true
    } catch (err) {
      success = false
      console.error('An error occurred saving backup file', err)
    }

    log(LoggingDomain.Backups, 'Finished saving text backup data', { success })
  }

  async changeTextBackupsLocation(): Promise<string | undefined> {
    const newPath = await openDirectoryPicker('Select')

    if (!newPath) {
      return undefined
    }

    const oldPath = await this.getTextBackupsLocation()

    if (oldPath) {
      await moveDirContents(oldPath, newPath)
    }

    this.appState.store.set(StoreKeys.TextBackupsLocation, newPath)

    return newPath
  }

  async openTextBackupsLocation(): Promise<void> {
    const location = await this.getTextBackupsLocation()
    log(LoggingDomain.Backups, 'Opening text backups location', location)
    if (!location) {
      return
    }

    void shell.openPath(location)
  }

  async copyDecryptScript(location: string) {
    try {
      await ensureDirectoryExists(location)
      await fs.copyFile(Paths.decryptScript, path.join(location, path.basename(Paths.decryptScript)))
    } catch (error) {
      console.error(error)
    }
  }

  private getPlaintextMappingFileLocation(): string {
    const base = this.appState.store.get(StoreKeys.PlaintextBackupsLocation)
    return `${base}/info.json`
  }

  private async getPlaintextMappingFileFromDisk(): Promise<PlaintextBackupsMapping | undefined> {
    return readJSONFile<PlaintextBackupsMapping>(this.getPlaintextMappingFileLocation())
  }

  private async savePlaintextBackupsMappingFile(file: PlaintextBackupsMapping): Promise<'success' | 'failed'> {
    await writeJSONFile(this.getPlaintextMappingFileLocation(), file)

    return 'success'
  }

  private defaultPlaintextMappingFileValue(): PlaintextBackupsMapping {
    return { version: '1.0', files: {} }
  }

  async getPlaintextBackupsMappingFile(): Promise<PlaintextBackupsMapping> {
    if (this.plaintextMappingCache) {
      return this.plaintextMappingCache
    }

    const data = await this.getPlaintextMappingFileFromDisk()

    if (!data) {
      return this.defaultPlaintextMappingFileValue()
    }

    this.plaintextMappingCache = data

    return data
  }

  async isPlaintextBackupsEnabled(): Promise<boolean> {
    return this.appState.store.get(StoreKeys.PlaintextBackupsEnabled)
  }

  async enablePlaintextBackups(): Promise<void> {
    const currentLocation = await this.getPlaintextBackupsLocation()

    if (!currentLocation) {
      const result = await this.changePlaintextBackupsLocation()

      if (!result) {
        return
      }
    }

    this.appState.store.set(StoreKeys.PlaintextBackupsEnabled, true)

    const mapping = this.getPlaintextMappingFileFromDisk()

    if (!mapping) {
      await this.savePlaintextBackupsMappingFile(this.defaultPlaintextMappingFileValue())
    }
  }

  async disablePlaintextBackups(): Promise<void> {
    this.appState.store.set(StoreKeys.PlaintextBackupsEnabled, false)
  }

  async getPlaintextBackupsLocation(): Promise<string | undefined> {
    const location = this.appState.store.get(StoreKeys.PlaintextBackupsLocation)
    if (!location) {
      return undefined
    }

    return `${location}/${PlaintextBackupsDirectoryName}`
  }

  async changePlaintextBackupsLocation(): Promise<string | undefined> {
    const newPath = await openDirectoryPicker('Select')

    if (!newPath) {
      return undefined
    }

    const oldPath = await this.getPlaintextBackupsLocation()

    if (oldPath) {
      await moveDirContents(oldPath, newPath)
    }

    this.appState.store.set(StoreKeys.PlaintextBackupsLocation, newPath)

    return newPath
  }

  async openPlaintextBackupsLocation(): Promise<void> {
    const location = await this.getPlaintextBackupsLocation()
    log(LoggingDomain.Backups, 'Opening plaintext backups location', location)
    if (!location) {
      return
    }

    void shell.openPath(location)
  }

  async savePlaintextNoteBackup(
    workspaceId: string,
    uuid: string,
    name: string,
    tags: string[],
    data: string,
  ): Promise<void> {
    const baseBackupsDir = await this.getPlaintextBackupsLocation()
    if (!baseBackupsDir) {
      log(LoggingDomain.Backups, 'Plaintext backups location not set, returning.')
      return
    }

    const workspaceBackupsDir = path.join(baseBackupsDir, workspaceId)
    log(LoggingDomain.Backups, 'Saving plaintext note backup', uuid, 'to', workspaceBackupsDir)

    const mapping = await this.getPlaintextBackupsMappingFile()
    if (!mapping.files[uuid]) {
      mapping.files[uuid] = []
    }

    const removeNoteFromAllDirectories = async () => {
      const records = mapping.files[uuid]
      for (const record of records) {
        const filePath = path.join(workspaceBackupsDir, record.path)
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
      await writeFileToPath(workspaceBackupsDir, `${name}.txt`, data)
    } else {
      for (const tag of tags) {
        await writeFileToPath(workspaceBackupsDir, `${name}.txt`, data, tag)
      }
    }
  }

  async persistPlaintextBackupsMappingFile(): Promise<void> {
    if (!this.plaintextMappingCache) {
      return
    }

    await this.savePlaintextBackupsMappingFile(this.plaintextMappingCache)
  }
}
