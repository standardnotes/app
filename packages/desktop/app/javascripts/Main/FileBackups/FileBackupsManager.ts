import { FileBackupsDevice, FileBackupsMapping } from '@web/Application/Device/DesktopSnjsExports'
import { AppState } from 'app/AppState'
import { shell } from 'electron'
import { StoreKeys } from '../Store/StoreKeys'
import path from 'path'
import {
  deleteFile,
  ensureDirectoryExists,
  moveFiles,
  openDirectoryPicker,
  readJSONFile,
  writeFile,
  writeJSONFile,
} from '../Utils/FileUtils'
import { FileDownloader } from './FileDownloader'

export const FileBackupsConstantsV1 = {
  Version: '1.0.0',
  MetadataFileName: 'metadata.sn.json',
  BinaryFileName: 'file.encrypted',
}

export class FilesBackupManager implements FileBackupsDevice {
  constructor(private appState: AppState) {}

  public isFilesBackupsEnabled(): Promise<boolean> {
    return Promise.resolve(this.appState.store.get(StoreKeys.FileBackupsEnabled))
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

  public disableFilesBackups(): Promise<void> {
    this.appState.store.set(StoreKeys.FileBackupsEnabled, false)

    return Promise.resolve()
  }

  public async changeFilesBackupsLocation(): Promise<string | undefined> {
    const newPath = await openDirectoryPicker()

    if (!newPath) {
      return undefined
    }

    const oldPath = await this.getFilesBackupsLocation()

    if (oldPath) {
      await this.transferFilesBackupsToNewLocation(oldPath, newPath)
    } else {
      this.appState.store.set(StoreKeys.FileBackupsLocation, newPath)
    }

    return newPath
  }

  private async transferFilesBackupsToNewLocation(oldPath: string, newPath: string): Promise<void> {
    const mapping = await this.getMappingFileFromDisk()
    if (!mapping) {
      return
    }

    const entries = Object.values(mapping.files)
    const itemFolders = entries.map((entry) => path.join(oldPath, entry.relativePath))
    await moveFiles(itemFolders, newPath)

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

  public getFilesBackupsLocation(): Promise<string> {
    return Promise.resolve(this.appState.store.get(StoreKeys.FileBackupsLocation))
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

    return data
  }

  async openFilesBackupsLocation(): Promise<void> {
    const location = await this.getFilesBackupsLocation()

    void shell.openPath(location)
  }

  async saveFilesBackupsMappingFile(file: FileBackupsMapping): Promise<'success' | 'failed'> {
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
}
