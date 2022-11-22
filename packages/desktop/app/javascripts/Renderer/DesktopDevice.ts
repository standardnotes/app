import {
  DesktopDeviceInterface,
  Environment,
  FileBackupsMapping,
  RawKeychainValue,
  FileBackupRecord,
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

  onMajorDataChange() {
    this.remoteBridge.onMajorDataChange()
  }

  onSearch(text: string) {
    this.remoteBridge.onSearch(text)
  }

  onInitialDataLoad() {
    this.remoteBridge.onInitialDataLoad()
  }

  async clearAllDataFromDevice(workspaceIdentifiers: string[]): Promise<{ killsApplication: boolean }> {
    await super.clearAllDataFromDevice(workspaceIdentifiers)

    this.remoteBridge.destroyAllData()

    return { killsApplication: true }
  }

  async downloadBackup() {
    const receiver = window.webClient

    receiver.didBeginBackup()

    try {
      const data = await receiver.requestBackupFile()
      if (data) {
        this.remoteBridge.saveDataBackup(data)
      } else {
        receiver.didFinishBackup(false)
      }
    } catch (error) {
      console.error(error)
      receiver.didFinishBackup(false)
    }
  }

  async localBackupsCount() {
    return this.remoteBridge.localBackupsCount()
  }

  viewlocalBackups() {
    this.remoteBridge.viewlocalBackups()
  }

  async deleteLocalBackups() {
    return this.remoteBridge.deleteLocalBackups()
  }

  public isFilesBackupsEnabled(): Promise<boolean> {
    return this.remoteBridge.isFilesBackupsEnabled()
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

  public getFilesBackupsLocation(): Promise<string> {
    return this.remoteBridge.getFilesBackupsLocation()
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

  async performHardReset(): Promise<void> {
    console.error('performHardReset is not yet implemented')
  }

  isDeviceDestroyed(): boolean {
    return false
  }
}
