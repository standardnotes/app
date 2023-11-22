import { CrossProcessBridge } from '../../Renderer/CrossProcessBridge'
import { Store } from '../Store/Store'
import { StoreKeys } from '../Store/StoreKeys'

const path = require('path')
const rendererPath = path.join('file://', __dirname, '/renderer.js')

import {
  FileBackupsDevice,
  FileBackupsMapping,
  FileBackupReadToken,
  FileBackupReadChunkResponse,
  HomeServerManagerInterface,
  PlaintextBackupsMapping,
  DirectoryManagerInterface,
} from '@web/Application/Device/DesktopSnjsExports'
import { app, BrowserWindow } from 'electron'
import { KeychainInterface } from '../Keychain/KeychainInterface'
import { MenuManagerInterface } from '../Menus/MenuManagerInterface'
import { Component, PackageManagerInterface } from '../Packages/PackageManagerInterface'
import { SearchManagerInterface } from '../Search/SearchManagerInterface'
import { RemoteDataInterface } from './DataInterface'
import { MediaManagerInterface } from '../Media/MediaManagerInterface'

/**
 * Read https://github.com/electron/remote to understand how electron/remote works.
 * RemoteBridge is imported from the Preload process but is declared and created on the main process.
 */
export class RemoteBridge implements CrossProcessBridge {
  constructor(
    private window: BrowserWindow,
    private keychain: KeychainInterface,
    private packages: PackageManagerInterface,
    private search: SearchManagerInterface,
    private data: RemoteDataInterface,
    private menus: MenuManagerInterface,
    private fileBackups: FileBackupsDevice,
    private media: MediaManagerInterface,
    private homeServerManager: HomeServerManagerInterface,
    private directoryManager: DirectoryManagerInterface,
  ) {}

  get exposableValue(): CrossProcessBridge {
    return {
      extServerHost: this.extServerHost,
      useNativeKeychain: this.useNativeKeychain,
      isMacOS: this.isMacOS,
      appVersion: this.appVersion,
      useSystemMenuBar: this.useSystemMenuBar,
      rendererPath: this.rendererPath,
      closeWindow: this.closeWindow.bind(this),
      minimizeWindow: this.minimizeWindow.bind(this),
      maximizeWindow: this.maximizeWindow.bind(this),
      unmaximizeWindow: this.unmaximizeWindow.bind(this),
      isWindowMaximized: this.isWindowMaximized.bind(this),
      getKeychainValue: this.getKeychainValue.bind(this),
      setKeychainValue: this.setKeychainValue.bind(this),
      clearKeychainValue: this.clearKeychainValue.bind(this),
      displayAppMenu: this.displayAppMenu.bind(this),
      syncComponents: this.syncComponents.bind(this),
      onSearch: this.onSearch.bind(this),
      destroyAllData: this.destroyAllData.bind(this),
      getFilesBackupsMappingFile: this.getFilesBackupsMappingFile.bind(this),
      saveFilesBackupsFile: this.saveFilesBackupsFile.bind(this),
      isLegacyFilesBackupsEnabled: this.isLegacyFilesBackupsEnabled.bind(this),
      getLegacyFilesBackupsLocation: this.getLegacyFilesBackupsLocation.bind(this),
      getFileBackupReadToken: this.getFileBackupReadToken.bind(this),
      readNextChunk: this.readNextChunk.bind(this),
      askForMediaAccess: this.askForMediaAccess.bind(this),
      startHomeServer: this.startHomeServer.bind(this),
      stopHomeServer: this.stopHomeServer.bind(this),
      wasLegacyTextBackupsExplicitlyDisabled: this.wasLegacyTextBackupsExplicitlyDisabled.bind(this),
      getLegacyTextBackupsLocation: this.getLegacyTextBackupsLocation.bind(this),
      saveTextBackupData: this.saveTextBackupData.bind(this),
      savePlaintextNoteBackup: this.savePlaintextNoteBackup.bind(this),
      openLocation: this.openLocation.bind(this),
      presentDirectoryPickerForLocationChangeAndTransferOld:
        this.presentDirectoryPickerForLocationChangeAndTransferOld.bind(this),
      getDirectoryManagerLastErrorMessage: this.getDirectoryManagerLastErrorMessage.bind(this),
      getPlaintextBackupsMappingFile: this.getPlaintextBackupsMappingFile.bind(this),
      persistPlaintextBackupsMappingFile: this.persistPlaintextBackupsMappingFile.bind(this),
      getTextBackupsCount: this.getTextBackupsCount.bind(this),
      migrateLegacyFileBackupsToNewStructure: this.migrateLegacyFileBackupsToNewStructure.bind(this),
      getUserDocumentsDirectory: this.getUserDocumentsDirectory.bind(this),
      monitorPlaintextBackupsLocationForChanges: this.monitorPlaintextBackupsLocationForChanges.bind(this),
      joinPaths: this.joinPaths.bind(this),
      setHomeServerConfiguration: this.setHomeServerConfiguration.bind(this),
      getHomeServerConfiguration: this.getHomeServerConfiguration.bind(this),
      setHomeServerDataLocation: this.setHomeServerDataLocation.bind(this),
      activatePremiumFeatures: this.activatePremiumFeatures.bind(this),
      isHomeServerRunning: this.isHomeServerRunning.bind(this),
      getHomeServerLogs: this.getHomeServerLogs.bind(this),
      getHomeServerUrl: this.getHomeServerUrl.bind(this),
      getHomeServerLastErrorMessage: this.getHomeServerLastErrorMessage.bind(this),
    }
  }

  get extServerHost() {
    return Store.get(StoreKeys.ExtServerHost)
  }

  get useNativeKeychain() {
    return Store.get(StoreKeys.UseNativeKeychain) ?? true
  }

  get rendererPath() {
    return rendererPath
  }

  get isMacOS() {
    return process.platform === 'darwin'
  }

  get appVersion() {
    return app.getVersion()
  }

  get useSystemMenuBar() {
    return Store.get(StoreKeys.UseSystemMenuBar)
  }

  closeWindow() {
    this.window.close()
  }

  minimizeWindow() {
    this.window.minimize()
  }

  maximizeWindow() {
    this.window.maximize()
  }

  unmaximizeWindow() {
    this.window.unmaximize()
  }

  isWindowMaximized() {
    return this.window.isMaximized()
  }

  async getKeychainValue() {
    return this.keychain.getKeychainValue()
  }

  async setKeychainValue(value: unknown) {
    return this.keychain.setKeychainValue(value)
  }

  async clearKeychainValue() {
    return this.keychain.clearKeychainValue()
  }

  syncComponents(components: Component[]) {
    void this.packages.syncComponents(components)
  }

  onSearch(text: string) {
    this.search.findInPage(text)
  }

  destroyAllData() {
    this.data.destroySensitiveDirectories()
  }

  displayAppMenu() {
    this.menus.popupMenu()
  }

  getFilesBackupsMappingFile(location: string): Promise<FileBackupsMapping> {
    return this.fileBackups.getFilesBackupsMappingFile(location)
  }

  saveFilesBackupsFile(
    location: string,
    uuid: string,
    metaFile: string,
    downloadRequest: {
      chunkSizes: number[]
      valetToken: string
      url: string
    },
  ): Promise<'success' | 'failed'> {
    return this.fileBackups.saveFilesBackupsFile(location, uuid, metaFile, downloadRequest)
  }

  getFileBackupReadToken(filePath: string): Promise<FileBackupReadToken> {
    return this.fileBackups.getFileBackupReadToken(filePath)
  }

  readNextChunk(nextToken: string): Promise<FileBackupReadChunkResponse> {
    return this.fileBackups.readNextChunk(nextToken)
  }

  public isLegacyFilesBackupsEnabled(): Promise<boolean> {
    return this.fileBackups.isLegacyFilesBackupsEnabled()
  }

  public getLegacyFilesBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.getLegacyFilesBackupsLocation()
  }

  wasLegacyTextBackupsExplicitlyDisabled(): Promise<boolean> {
    return this.fileBackups.wasLegacyTextBackupsExplicitlyDisabled()
  }

  getLegacyTextBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.getLegacyTextBackupsLocation()
  }

  saveTextBackupData(location: string, data: string): Promise<void> {
    return this.fileBackups.saveTextBackupData(location, data)
  }

  savePlaintextNoteBackup(location: string, uuid: string, name: string, tags: string[], data: string): Promise<void> {
    return this.fileBackups.savePlaintextNoteBackup(location, uuid, name, tags, data)
  }

  async openLocation(path: string): Promise<void> {
    return this.directoryManager.openLocation(path)
  }

  async presentDirectoryPickerForLocationChangeAndTransferOld(
    appendPath: string,
    oldLocation?: string | undefined,
  ): Promise<string | undefined> {
    return this.directoryManager.presentDirectoryPickerForLocationChangeAndTransferOld(appendPath, oldLocation)
  }

  async getDirectoryManagerLastErrorMessage(): Promise<string | undefined> {
    return this.directoryManager.getDirectoryManagerLastErrorMessage()
  }

  getPlaintextBackupsMappingFile(location: string): Promise<PlaintextBackupsMapping> {
    return this.fileBackups.getPlaintextBackupsMappingFile(location)
  }

  persistPlaintextBackupsMappingFile(location: string): Promise<void> {
    return this.fileBackups.persistPlaintextBackupsMappingFile(location)
  }

  getTextBackupsCount(location: string): Promise<number> {
    return this.fileBackups.getTextBackupsCount(location)
  }

  migrateLegacyFileBackupsToNewStructure(newPath: string): Promise<void> {
    return this.fileBackups.migrateLegacyFileBackupsToNewStructure(newPath)
  }

  getUserDocumentsDirectory(): Promise<string | undefined> {
    return this.fileBackups.getUserDocumentsDirectory()
  }

  monitorPlaintextBackupsLocationForChanges(backupsDirectory: string): Promise<void> {
    return this.fileBackups.monitorPlaintextBackupsLocationForChanges(backupsDirectory)
  }

  joinPaths(...paths: string[]): Promise<string> {
    return this.fileBackups.joinPaths(...paths)
  }

  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean> {
    return this.media.askForMediaAccess(type)
  }

  async startHomeServer(): Promise<string | undefined> {
    return this.homeServerManager.startHomeServer()
  }

  async stopHomeServer(): Promise<string | undefined> {
    return this.homeServerManager.stopHomeServer()
  }

  async setHomeServerConfiguration(configurationJSONString: string): Promise<void> {
    return this.homeServerManager.setHomeServerConfiguration(configurationJSONString)
  }

  async getHomeServerConfiguration(): Promise<string | undefined> {
    return this.homeServerManager.getHomeServerConfiguration()
  }

  async setHomeServerDataLocation(location: string): Promise<void> {
    return this.homeServerManager.setHomeServerDataLocation(location)
  }

  async activatePremiumFeatures(username: string, subscriptionId: number): Promise<string | undefined> {
    return this.homeServerManager.activatePremiumFeatures(username, subscriptionId)
  }

  async isHomeServerRunning(): Promise<boolean> {
    return this.homeServerManager.isHomeServerRunning()
  }

  async getHomeServerLogs(): Promise<string[]> {
    return this.homeServerManager.getHomeServerLogs()
  }

  async getHomeServerUrl(): Promise<string | undefined> {
    return this.homeServerManager.getHomeServerUrl()
  }

  async getHomeServerLastErrorMessage(): Promise<string | undefined> {
    return this.homeServerManager.getHomeServerLastErrorMessage()
  }
}
