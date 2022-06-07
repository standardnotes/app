import { CrossProcessBridge } from '../../Renderer/CrossProcessBridge'
import { Store, StoreKeys } from '../Store'

const path = require('path')
const rendererPath = path.join('file://', __dirname, '/renderer.js')

import { app, BrowserWindow } from 'electron'
import { KeychainInterface } from '../Keychain/KeychainInterface'
import { BackupsManagerInterface } from '../Backups/BackupsManagerInterface'
import { PackageManagerInterface, Component } from '../Packages/PackageManagerInterface'
import { SearchManagerInterface } from '../Search/SearchManagerInterface'
import { RemoteDataInterface } from './DataInterface'
import { MenuManagerInterface } from '../Menus/MenuManagerInterface'
import { FileBackupsDevice, FileBackupsMapping } from '@web/Application/Device/DesktopSnjsExports'

/**
 * Read https://github.com/electron/remote to understand how electron/remote works.
 * RemoteBridge is imported from the Preload process but is declared and created on the main process.
 */
export class RemoteBridge implements CrossProcessBridge {
  constructor(
    private window: BrowserWindow,
    private keychain: KeychainInterface,
    private backups: BackupsManagerInterface,
    private packages: PackageManagerInterface,
    private search: SearchManagerInterface,
    private data: RemoteDataInterface,
    private menus: MenuManagerInterface,
    private fileBackups: FileBackupsDevice,
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
      localBackupsCount: this.localBackupsCount.bind(this),
      viewlocalBackups: this.viewlocalBackups.bind(this),
      deleteLocalBackups: this.deleteLocalBackups.bind(this),
      displayAppMenu: this.displayAppMenu.bind(this),
      saveDataBackup: this.saveDataBackup.bind(this),
      syncComponents: this.syncComponents.bind(this),
      onMajorDataChange: this.onMajorDataChange.bind(this),
      onSearch: this.onSearch.bind(this),
      onInitialDataLoad: this.onInitialDataLoad.bind(this),
      destroyAllData: this.destroyAllData.bind(this),
      getFilesBackupsMappingFile: this.getFilesBackupsMappingFile.bind(this),
      saveFilesBackupsFile: this.saveFilesBackupsFile.bind(this),
      isFilesBackupsEnabled: this.isFilesBackupsEnabled.bind(this),
      enableFilesBackups: this.enableFilesBackups.bind(this),
      disableFilesBackups: this.disableFilesBackups.bind(this),
      changeFilesBackupsLocation: this.changeFilesBackupsLocation.bind(this),
      getFilesBackupsLocation: this.getFilesBackupsLocation.bind(this),
      openFilesBackupsLocation: this.openFilesBackupsLocation.bind(this),
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

  async localBackupsCount() {
    return this.backups.backupsCount()
  }

  viewlocalBackups() {
    this.backups.viewBackups()
  }

  async deleteLocalBackups() {
    return this.backups.deleteBackups()
  }

  syncComponents(components: Component[]) {
    this.packages.syncComponents(components)
  }

  onMajorDataChange() {
    this.backups.performBackup()
  }

  onSearch(text: string) {
    this.search.findInPage(text)
  }

  onInitialDataLoad() {
    this.backups.beginBackups()
  }

  destroyAllData() {
    this.data.destroySensitiveDirectories()
  }

  saveDataBackup(data: unknown) {
    this.backups.saveBackupData(data)
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

  public getFilesBackupsLocation(): Promise<string> {
    return this.fileBackups.getFilesBackupsLocation()
  }

  public openFilesBackupsLocation(): Promise<void> {
    return this.fileBackups.openFilesBackupsLocation()
  }
}
