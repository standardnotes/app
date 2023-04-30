import {
  DesktopDeviceInterface,
  Environment,
  RawKeychainValue,
  FileBackupRecord,
  FileBackupReadToken,
  FileBackupReadChunkResponse,
  FileBackupsMapping,
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

  openLocation(path: string): Promise<void> {
    return this.remoteBridge.openLocation(path)
  }

  presentDirectoryPickerForLocationChangeAndTransferOld(
    appendPath: string,
    oldLocation?: string | undefined,
  ): Promise<string | undefined> {
    return this.remoteBridge.presentDirectoryPickerForLocationChangeAndTransferOld(appendPath, oldLocation)
  }

  getFilesBackupsMappingFile(location: string): Promise<FileBackupsMapping> {
    return this.remoteBridge.getFilesBackupsMappingFile(location)
  }

  getPlaintextBackupsMappingFile(location: string): Promise<PlaintextBackupsMapping> {
    return this.remoteBridge.getPlaintextBackupsMappingFile(location)
  }

  persistPlaintextBackupsMappingFile(location: string): Promise<void> {
    return this.remoteBridge.persistPlaintextBackupsMappingFile(location)
  }

  getTextBackupsCount(location: string): Promise<number> {
    return this.remoteBridge.getTextBackupsCount(location)
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

  public getLegacyFilesBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.getLegacyFilesBackupsLocation()
  }

  isLegacyTextBackupsEnabled(): Promise<boolean> {
    return this.remoteBridge.isLegacyTextBackupsEnabled()
  }

  getLegacyTextBackupsLocation(): Promise<string | undefined> {
    return this.remoteBridge.getLegacyTextBackupsLocation()
  }

  saveTextBackupData(workspaceId: string, data: string): Promise<void> {
    return this.remoteBridge.saveTextBackupData(workspaceId, data)
  }

  savePlaintextNoteBackup(location: string, uuid: string, name: string, tags: string[], data: string): Promise<void> {
    return this.remoteBridge.savePlaintextNoteBackup(location, uuid, name, tags, data)
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
    return this.remoteBridge.saveFilesBackupsFile(location, uuid, metaFile, downloadRequest)
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
