import { CrossProcessBridge } from '../../Renderer/CrossProcessBridge'
import { Store } from '../Store/Store'
import { StoreKeys } from '../Store/StoreKeys'

const path = require('path')
const rendererPath = path.join('file://', __dirname, '/renderer.js')

import {
  FileBackupsDevice,
  FileBackupsMapping,
  FileBackupRecord,
  FileBackupReadToken,
  FileBackupReadChunkResponse,
  PlaintextBackupsMapping,
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
      isFilesBackupsEnabled: this.isFilesBackupsEnabled.bind(this),
      enableFilesBackups: this.enableFilesBackups.bind(this),
      disableFilesBackups: this.disableFilesBackups.bind(this),
      changeFilesBackupsLocation: this.changeFilesBackupsLocation.bind(this),
      getFilesBackupsLocation: this.getFilesBackupsLocation.bind(this),
      openFilesBackupsLocation: this.openFilesBackupsLocation.bind(this),
      openFileBackup: this.openFileBackup.bind(this),
      getFileBackupReadToken: this.getFileBackupReadToken.bind(this),
      readNextChunk: this.readNextChunk.bind(this),
      askForMediaAccess: this.askForMediaAccess.bind(this),
      isTextBackupsEnabled: this.isTextBackupsEnabled.bind(this),
      enableTextBackups: this.enableTextBackups.bind(this),
      disableTextBackups: this.disableTextBackups.bind(this),
      getTextBackupsLocation: this.getTextBackupsLocation.bind(this),
      changeTextBackupsLocation: this.changeTextBackupsLocation.bind(this),
      openTextBackupsLocation: this.openTextBackupsLocation.bind(this),
      getTextBackupsCount: this.getTextBackupsCount.bind(this),
      deleteTextBackups: this.deleteTextBackups.bind(this),
      saveTextBackupData: this.saveTextBackupData.bind(this),
      getPlaintextBackupsMappingFile: this.getPlaintextBackupsMappingFile.bind(this),
      persistPlaintextBackupsMappingFile: this.persistPlaintextBackupsMappingFile.bind(this),
      isPlaintextBackupsEnabled: this.isPlaintextBackupsEnabled.bind(this),
      enablePlaintextBackups: this.enablePlaintextBackups.bind(this),
      disablePlaintextBackups: this.disablePlaintextBackups.bind(this),
      getPlaintextBackupsLocation: this.getPlaintextBackupsLocation.bind(this),
      changePlaintextBackupsLocation: this.changePlaintextBackupsLocation.bind(this),
      openPlaintextBackupsLocation: this.openPlaintextBackupsLocation.bind(this),
      savePlaintextNoteBackup: this.savePlaintextNoteBackup.bind(this),
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

  getFilesBackupsMappingFile(): Promise<FileBackupsMapping> {
    return this.fileBackups.getFilesBackupsMappingFile()
  }

  saveFilesBackupsFile(
    uuid: string,
    metaFile: string,
    downloadRequest: {
      chunkSizes: number[]
      valetToken: string
      url: string
    },
  ): Promise<'success' | 'failed'> {
    return this.fileBackups.saveFilesBackupsFile(uuid, metaFile, downloadRequest)
  }

  getFileBackupReadToken(record: FileBackupRecord): Promise<FileBackupReadToken> {
    return this.fileBackups.getFileBackupReadToken(record)
  }

  readNextChunk(nextToken: string): Promise<FileBackupReadChunkResponse> {
    return this.fileBackups.readNextChunk(nextToken)
  }

  public isFilesBackupsEnabled(): Promise<boolean> {
    return this.fileBackups.isFilesBackupsEnabled()
  }

  public enableFilesBackups(): Promise<void> {
    return this.fileBackups.enableFilesBackups()
  }

  public disableFilesBackups(): Promise<void> {
    return this.fileBackups.disableFilesBackups()
  }

  public changeFilesBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.changeFilesBackupsLocation()
  }

  public getFilesBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.getFilesBackupsLocation()
  }

  public openFilesBackupsLocation(): Promise<void> {
    return this.fileBackups.openFilesBackupsLocation()
  }

  public openFileBackup(record: FileBackupRecord): Promise<void> {
    return this.fileBackups.openFileBackup(record)
  }

  isTextBackupsEnabled(): Promise<boolean> {
    return this.fileBackups.isTextBackupsEnabled()
  }

  enableTextBackups(): Promise<void> {
    return this.fileBackups.enableTextBackups()
  }

  disableTextBackups(): Promise<void> {
    return this.fileBackups.disableTextBackups()
  }

  getTextBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.getTextBackupsLocation()
  }

  getTextBackupsCount(): Promise<number> {
    return this.fileBackups.getTextBackupsCount()
  }

  deleteTextBackups(): Promise<void> {
    return this.fileBackups.deleteTextBackups()
  }

  saveTextBackupData(workspaceId: string, data: unknown): Promise<void> {
    return this.fileBackups.saveTextBackupData(workspaceId, data)
  }

  changeTextBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.changeTextBackupsLocation()
  }

  openTextBackupsLocation(): Promise<void> {
    return this.fileBackups.openTextBackupsLocation()
  }

  getPlaintextBackupsMappingFile(): Promise<PlaintextBackupsMapping> {
    return this.fileBackups.getPlaintextBackupsMappingFile()
  }

  persistPlaintextBackupsMappingFile(): Promise<void> {
    return this.fileBackups.persistPlaintextBackupsMappingFile()
  }

  isPlaintextBackupsEnabled(): Promise<boolean> {
    return this.fileBackups.isPlaintextBackupsEnabled()
  }

  enablePlaintextBackups(): Promise<void> {
    return this.fileBackups.enablePlaintextBackups()
  }

  disablePlaintextBackups(): Promise<void> {
    return this.fileBackups.disablePlaintextBackups()
  }

  getPlaintextBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.getPlaintextBackupsLocation()
  }

  changePlaintextBackupsLocation(): Promise<string | undefined> {
    return this.fileBackups.changePlaintextBackupsLocation()
  }

  openPlaintextBackupsLocation(): Promise<void> {
    return this.fileBackups.openPlaintextBackupsLocation()
  }

  savePlaintextNoteBackup(
    workspaceId: string,
    uuid: string,
    name: string,
    tags: string[],
    data: string,
  ): Promise<void> {
    return this.fileBackups.savePlaintextNoteBackup(workspaceId, uuid, name, tags, data)
  }

  askForMediaAccess(type: 'camera' | 'microphone'): Promise<boolean> {
    return this.media.askForMediaAccess(type)
  }
}
