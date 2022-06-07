import { FileBackupsDevice, FileBackupsMapping } from '@web/Application/Device/DesktopSnjsExports'
import { AppState } from 'app/application'
import { StoreKeys } from '../Store'
import {
  ensureDirectoryExists,
  moveDirContents,
  openDirectoryPicker,
  readJSONFile,
  writeFile,
  writeJSONFile,
} from '../Utils/FileUtils'
import { FileDownloader } from './FileDownloader'
import { shell } from 'electron'

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
      await moveDirContents(oldPath, newPath)
    }

    this.appState.store.set(StoreKeys.FileBackupsLocation, newPath)

    return newPath
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

    shell.openPath(location)
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
