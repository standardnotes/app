import {
  DesktopDeviceInterface,
  Environment,
  FileBackupsMapping,
  RawKeychainValue,
  FileBackupRecord,
  FileBackupReadToken,
  FileBackupReadChunkResponse,
  PlaintextBackupsMapping,
} from '@web/Application/Device/DesktopSnjsExports'
import { WebOrDesktopDevice } from '@web/Application/Device/WebOrDesktopDevice'
import { Component } from '../Main/Packages/PackageManagerInterface'
import { CrossProcessBridge } from './CrossProcessBridge'

const FallbackLocalStorageKey = 'keychain'

export class DesktopDevice extends WebOrDesktopDevice implements DesktopDeviceInterface {
  public environment: Environment.Desktop = Environment.Desktop

  constructor(
    private remoteBridge: CrossProcessBridge,
    private useNativeKeychain: boolean,
    public extensionsServerHost: string,
    appVersion: string,
  ) {
    super(appVersion)
  }

  async getKeychainValue() {
    if (this.useNativeKeychain) {
      const keychainValue = await this.remoteBridge.getKeychainValue()
      return keychainValue
    } else {
      const value = window.localStorage.getItem(FallbackLocalStorageKey)
      if (value) {
        return JSON.parse(value)
      }
    }
  }

  async setKeychainValue(value: RawKeychainValue) {
    if (this.useNativeKeychain) {
      await this.remoteBridge.setKeychainValue(value)
    } else {
      window.localStorage.setItem(FallbackLocalStorageKey, JSON.stringify(value))
    }
  }

  async clearRawKeychainValue() {
    if (this.useNativeKeychain) {
      await this.remoteBridge.clearKeychainValue()
    } else {
      window.localStorage.removeItem(FallbackLocalStorageKey)
    }
  }

  syncComponents(components: Component[]) {
    this.remoteBridge.syncComponents(components)
  }

  onSearch(text: string) {
    this.remoteBridge.onSearch(text)
  }

  async clearAllDataFromDevice(workspaceIdentifiers: string[]): Promise<{ killsApplication: boolean }> {
    await super.clearAllDataFromDevice(workspaceIdentifiers)

    this.remoteBridge.destroyAllData()

    return { killsApplication: true }
  }

  public isLegacyFilesBackupsEnabled(): Promise<boolean> {
    return this.remoteBridge.isLegacyFilesBackupsEnabled()
  }

  public enableFilesBackups(): Promise<void> {
    return this.remoteBridge.enableFilesBackups()
  }

  public disableFilesBackups(): Promise<void> {
    return this.remoteBridge.disableFilesBackups()
  }

  public changeFilesBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.changeFilesBackupsLocation()
  }

  public getLegacyFilesBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.getLegacyFilesBackupsLocation()
  }

  async getFilesBackupsMappingFile(): Promise<FileBackupsMapping> {
    return this.remoteBridge.getFilesBackupsMappingFile()
  }

  async openFilesBackupsLocation(): Promise<void> {
    return this.remoteBridge.openFilesBackupsLocation()
  }

  openFileBackup(record: FileBackupRecord): Promise<void> {
    return this.remoteBridge.openFileBackup(record)
  }

  isLegacyTextBackupsEnabled(): Promise<boolean> {
    return this.remoteBridge.isLegacyTextBackupsEnabled()
  }

  enableTextBackups(): Promise<void> {
    return this.remoteBridge.enableTextBackups()
  }

  disableTextBackups(): Promise<void> {
    return this.remoteBridge.disableTextBackups()
  }

  getLegacyTextBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.getLegacyTextBackupsLocation()
  }

  changeTextBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.changeTextBackupsLocation()
  }

  openTextBackupsLocation(): Promise<void> {
    return this.remoteBridge.openTextBackupsLocation()
  }

  getTextBackupsCount(): Promise<number> {
    return this.remoteBridge.getTextBackupsCount()
  }

  deleteTextBackups(): Promise<void> {
    return this.remoteBridge.deleteTextBackups()
  }

  saveTextBackupData(workspaceId: string, data: unknown): Promise<void> {
    return this.remoteBridge.saveTextBackupData(workspaceId, data)
  }

  getPlaintextBackupsMappingFile(): Promise<PlaintextBackupsMapping> {
    return this.remoteBridge.getPlaintextBackupsMappingFile()
  }

  persistPlaintextBackupsMappingFile(): Promise<void> {
    return this.remoteBridge.persistPlaintextBackupsMappingFile()
  }

  isPlaintextBackupsEnabled(): Promise<boolean> {
    return this.remoteBridge.isPlaintextBackupsEnabled()
  }

  enablePlaintextBackups(): Promise<void> {
    return this.remoteBridge.enablePlaintextBackups()
  }

  disablePlaintextBackups(): Promise<void> {
    return this.remoteBridge.disablePlaintextBackups()
  }

  getPlaintextBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.getPlaintextBackupsLocation()
  }

  changePlaintextBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.changePlaintextBackupsLocation()
  }

  openPlaintextBackupsLocation(): Promise<void> {
    return this.remoteBridge.openPlaintextBackupsLocation()
  }

  savePlaintextNoteBackup(
    workspaceId: string,
    uuid: string,
    name: string,
    tags: string[],
    data: string,
  ): Promise<void> {
    return this.remoteBridge.savePlaintextNoteBackup(workspaceId, uuid, name, tags, data)
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
    return this.remoteBridge.saveFilesBackupsFile(uuid, metaFile, downloadRequest)
  }

  getFileBackupReadToken(record: FileBackupRecord): Promise<FileBackupReadToken> {
    return this.remoteBridge.getFileBackupReadToken(record)
  }

  readNextChunk(token: string): Promise<FileBackupReadChunkResponse> {
    return this.remoteBridge.readNextChunk(token)
  }

  async performHardReset(): Promise<void> {
    console.error('performHardReset is not yet implemented')
  }

  isDeviceDestroyed(): boolean {
    return false
  }

  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean> {
    return this.remoteBridge.askForMediaAccess(type)
  }
}
