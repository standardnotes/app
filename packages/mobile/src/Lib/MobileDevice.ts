import SNReactNative from '@standardnotes/react-native-utils'
import {
  AppleIAPProductId,
  AppleIAPReceipt,
  ApplicationIdentifier,
  DatabaseKeysLoadChunkResponse,
  DatabaseLoadOptions,
  Environment,
  MobileDeviceInterface,
  NamespacedRootKeyInKeychain,
  Platform as SNPlatform,
  RawKeychainValue,
  removeFromArray,
  TransferPayload,
  UuidString,
} from '@standardnotes/snjs'
import { ColorSchemeObserverService } from 'ColorSchemeObserverService'
import {
  Alert,
  Appearance,
  AppState,
  AppStateStatus,
  ColorSchemeName,
  Linking,
  PermissionsAndroid,
  Platform,
  StatusBar,
} from 'react-native'
import FileViewer from 'react-native-file-viewer'
import FingerprintScanner from 'react-native-fingerprint-scanner'
import FlagSecure from 'react-native-flag-secure-android'
import {
  CachesDirectoryPath,
  DocumentDirectoryPath,
  DownloadDirectoryPath,
  exists,
  unlink,
  writeFile,
} from 'react-native-fs'
import { hide, show } from 'react-native-privacy-snapshot'
import Share from 'react-native-share'
import { AndroidBackHandlerService } from '../AndroidBackHandlerService'
import { AppStateObserverService } from '../AppStateObserverService'
import { PurchaseManager } from '../PurchaseManager'
import { Database } from './Database/Database'
import { isLegacyIdentifier } from './Database/LegacyIdentifier'
import { LegacyKeyValueStore } from './Database/LegacyKeyValueStore'
import Keychain from './Keychain'

export type BiometricsType = 'Fingerprint' | 'Face ID' | 'Biometrics' | 'Touch ID'

export enum MobileDeviceEvent {
  RequestsWebViewReload = 0,
}

type MobileDeviceEventHandler = (event: MobileDeviceEvent) => void

export class MobileDevice implements MobileDeviceInterface {
  environment: Environment.Mobile = Environment.Mobile
  platform: SNPlatform.Ios | SNPlatform.Android = Platform.OS === 'ios' ? SNPlatform.Ios : SNPlatform.Android
  private eventObservers: MobileDeviceEventHandler[] = []
  public isDarkMode = false
  public statusBarBgColor: string | undefined
  private componentUrls: Map<UuidString, string> = new Map()
  private keyValueStore = new LegacyKeyValueStore()
  private databases = new Map<string, Database>()

  constructor(
    private stateObserverService?: AppStateObserverService,
    private androidBackHandlerService?: AndroidBackHandlerService,
    private colorSchemeService?: ColorSchemeObserverService,
  ) {}

  purchaseSubscriptionIAP(plan: AppleIAPProductId): Promise<AppleIAPReceipt | undefined> {
    return PurchaseManager.getInstance().purchase(plan)
  }

  private findOrCreateDatabase(identifier: ApplicationIdentifier): Database {
    const existing = this.databases.get(identifier)
    if (existing) {
      return existing
    }

    const newDb = new Database(identifier)
    this.databases.set(identifier, newDb)
    return newDb
  }

  deinit() {
    this.stateObserverService?.deinit()
    ;(this.stateObserverService as unknown) = undefined
    this.androidBackHandlerService?.deinit()
    ;(this.androidBackHandlerService as unknown) = undefined
    this.colorSchemeService?.deinit()
    ;(this.colorSchemeService as unknown) = undefined
  }

  consoleLog(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(args)
  }

  public async getJsonParsedRawStorageValue(key: string): Promise<unknown | undefined> {
    const value = await this.getRawStorageValue(key)
    if (value == undefined) {
      return undefined
    }
    try {
      return JSON.parse(value)
    } catch (e) {
      return value
    }
  }

  getRawStorageValue(key: string): Promise<string | undefined> {
    return this.keyValueStore.getValue(key)
  }

  setRawStorageValue(key: string, value: string): Promise<void> {
    return this.keyValueStore.set(key, value)
  }

  removeRawStorageValue(key: string): Promise<void> {
    return this.keyValueStore.delete(key)
  }

  removeAllRawStorageValues(): Promise<void> {
    return this.keyValueStore.deleteAll()
  }

  openDatabase(): Promise<{ isNewDatabase?: boolean | undefined } | undefined> {
    return Promise.resolve({ isNewDatabase: false })
  }

  getDatabaseLoadChunks(options: DatabaseLoadOptions, identifier: string): Promise<DatabaseKeysLoadChunkResponse> {
    return this.findOrCreateDatabase(identifier).getLoadChunks(options)
  }

  async getAllDatabaseEntries<T extends TransferPayload = TransferPayload>(
    identifier: ApplicationIdentifier,
  ): Promise<T[]> {
    return this.findOrCreateDatabase(identifier).getAllEntries()
  }

  async getDatabaseEntries<T extends TransferPayload = TransferPayload>(
    identifier: ApplicationIdentifier,
    keys: string[],
  ): Promise<T[]> {
    return this.findOrCreateDatabase(identifier).multiGet<T>(keys)
  }

  saveDatabaseEntry(payload: TransferPayload, identifier: ApplicationIdentifier): Promise<void> {
    return this.saveDatabaseEntries([payload], identifier)
  }

  async saveDatabaseEntries(payloads: TransferPayload[], identifier: ApplicationIdentifier): Promise<void> {
    return this.findOrCreateDatabase(identifier).setItems(payloads)
  }

  removeDatabaseEntry(id: string, identifier: ApplicationIdentifier): Promise<void> {
    return this.findOrCreateDatabase(identifier).deleteItem(id)
  }

  async removeAllDatabaseEntries(identifier: ApplicationIdentifier): Promise<void> {
    return this.findOrCreateDatabase(identifier).deleteAll()
  }

  async getDeviceBiometricsAvailability() {
    try {
      await FingerprintScanner.isSensorAvailable()
      return true
    } catch (e) {
      return false
    }
  }

  async authenticateWithBiometrics() {
    this.stateObserverService?.beginIgnoringStateChanges()

    const result = await new Promise<boolean>((resolve) => {
      if (Platform.OS === 'android') {
        FingerprintScanner.authenticate({
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore ts type does not exist for deviceCredentialAllowed
          deviceCredentialAllowed: true,
          description: 'Biometrics are required to access your notes.',
        })
          .then(() => {
            FingerprintScanner.release()
            resolve(true)
          })
          .catch((error) => {
            FingerprintScanner.release()
            if (error.name === 'DeviceLocked') {
              Alert.alert('Unsuccessful', 'Authentication failed. Wait 30 seconds to try again.')
            } else {
              Alert.alert('Unsuccessful', 'Authentication failed. Tap to try again.')
            }
            resolve(false)
          })
      } else {
        // iOS
        FingerprintScanner.authenticate({
          fallbackEnabled: true,
          description: 'This is required to access your notes.',
        })
          .then(() => {
            FingerprintScanner.release()
            resolve(true)
          })
          .catch((error_1) => {
            FingerprintScanner.release()
            if (error_1.name !== 'SystemCancel') {
              if (error_1.name !== 'UserCancel') {
                Alert.alert('Unsuccessful')
              } else {
                Alert.alert('Unsuccessful', 'Authentication failed. Tap to try again.')
              }
            }
            resolve(false)
          })
      }
    })

    this.stateObserverService?.stopIgnoringStateChanges()

    return result
  }

  async getNamespacedKeychainValue(
    identifier: ApplicationIdentifier,
  ): Promise<NamespacedRootKeyInKeychain | undefined> {
    const keychain = await this.getRawKeychainValue()

    if (!keychain) {
      return
    }

    const namespacedValue = keychain[identifier]

    if (!namespacedValue && isLegacyIdentifier(identifier)) {
      return keychain as unknown as NamespacedRootKeyInKeychain
    }

    return namespacedValue
  }

  async setNamespacedKeychainValue(
    value: NamespacedRootKeyInKeychain,
    identifier: ApplicationIdentifier,
  ): Promise<void> {
    let keychain = await this.getRawKeychainValue()

    if (!keychain) {
      keychain = {}
    }

    await Keychain.setKeys({
      ...keychain,
      [identifier]: value,
    })
  }

  async clearNamespacedKeychainValue(identifier: ApplicationIdentifier): Promise<void> {
    const keychain = await this.getRawKeychainValue()

    if (!keychain) {
      return
    }

    delete keychain[identifier]
    await Keychain.setKeys(keychain)
  }

  async getRawKeychainValue(): Promise<RawKeychainValue | undefined> {
    const result = await Keychain.getKeys()

    if (result === null) {
      return undefined
    }

    return result
  }

  async clearRawKeychainValue(): Promise<void> {
    await Keychain.clearKeys()
  }

  setAndroidScreenshotPrivacy(enable: boolean): void {
    if (Platform.OS === 'android') {
      enable ? FlagSecure.activate() : FlagSecure.deactivate()
    }
  }

  openUrl(url: string) {
    const showAlert = () => {
      Alert.alert('Unable to Open', `Unable to open URL ${url}.`)
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) {
          showAlert()
          return
        } else {
          return Linking.openURL(url)
        }
      })
      .catch(() => showAlert())
  }

  async clearAllDataFromDevice(_workspaceIdentifiers: string[]): Promise<{ killsApplication: boolean }> {
    await this.removeAllRawStorageValues()

    await this.clearRawKeychainValue()

    return { killsApplication: false }
  }

  performSoftReset() {
    this.notifyEvent(MobileDeviceEvent.RequestsWebViewReload)
  }

  addMobileWebEventReceiver(handler: MobileDeviceEventHandler): () => void {
    this.eventObservers.push(handler)

    const thislessObservers = this.eventObservers

    return () => {
      removeFromArray(thislessObservers, handler)
    }
  }

  handleThemeSchemeChange(isDark: boolean, bgColor: string): void {
    this.isDarkMode = isDark
    this.statusBarBgColor = bgColor

    this.reloadStatusBarStyle()
  }

  reloadStatusBarStyle(animated = true) {
    if (this.statusBarBgColor && Platform.OS === 'android') {
      StatusBar.setBackgroundColor(this.statusBarBgColor, animated)
    }
    StatusBar.setBarStyle(this.isDarkMode ? 'light-content' : 'dark-content', animated)
  }

  private notifyEvent(event: MobileDeviceEvent): void {
    for (const handler of this.eventObservers) {
      handler(event)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  performHardReset() {}

  isDeviceDestroyed() {
    return false
  }

  async deleteFileAtPathIfExists(path: string) {
    if (await exists(path)) {
      await unlink(path)
    }
  }

  async shareBase64AsFile(base64: string, filename: string) {
    let downloadedTempFilePath: string | undefined
    try {
      downloadedTempFilePath = await this.downloadBase64AsFile(base64, filename, true)
      if (!downloadedTempFilePath) {
        return
      }
      await Share.open({
        url: `file://${downloadedTempFilePath}`,
        failOnCancel: false,
      })
    } catch (error) {
      this.consoleLog(`${error}`)
    } finally {
      if (downloadedTempFilePath) {
        void this.deleteFileAtPathIfExists(downloadedTempFilePath)
      }
    }
  }

  getFileDestinationPath(filename: string, saveInTempLocation: boolean): string {
    let directory = DocumentDirectoryPath

    if (Platform.OS === 'android') {
      directory = saveInTempLocation ? CachesDirectoryPath : DownloadDirectoryPath
    }

    return `${directory}/${filename}`
  }

  async hasStoragePermissionOnAndroid(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true
    }
    const grantedStatus = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
    if (grantedStatus === PermissionsAndroid.RESULTS.GRANTED) {
      return true
    }
    Alert.alert(
      'Storage permissions are required in order to download files. Please accept the permissions prompt and try again.',
    )
    return false
  }

  async downloadBase64AsFile(
    base64: string,
    filename: string,
    saveInTempLocation = false,
  ): Promise<string | undefined> {
    const isGrantedStoragePermissionOnAndroid = await this.hasStoragePermissionOnAndroid()

    if (!isGrantedStoragePermissionOnAndroid) {
      return
    }

    try {
      const path = this.getFileDestinationPath(filename, saveInTempLocation)
      await this.deleteFileAtPathIfExists(path)
      await writeFile(path, base64.replace(/data.*base64,/, ''), 'base64')
      return path
    } catch (error) {
      this.consoleLog(`${error}`)
    }
  }

  async previewFile(base64: string, filename: string): Promise<boolean> {
    const tempLocation = await this.downloadBase64AsFile(base64, filename, true)

    if (!tempLocation) {
      this.consoleLog('Error: Could not download file to preview')
      return false
    }

    try {
      await FileViewer.open(tempLocation, {
        onDismiss: async () => {
          await this.deleteFileAtPathIfExists(tempLocation)
        },
      })
    } catch (error) {
      this.consoleLog(error)
      return false
    }

    return true
  }

  exitApp(shouldConfirm?: boolean) {
    if (!shouldConfirm) {
      SNReactNative.exitApp()
      return
    }

    Alert.alert(
      'Close app',
      'Do you want to close the app?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onPress: async () => {},
        },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            SNReactNative.exitApp()
          },
        },
      ],
      {
        cancelable: true,
      },
    )
  }

  addComponentUrl(componentUuid: UuidString, componentUrl: string) {
    this.componentUrls.set(componentUuid, componentUrl)
  }

  removeComponentUrl(componentUuid: UuidString) {
    this.componentUrls.delete(componentUuid)
  }

  isUrlComponentUrl(url: string): boolean {
    return Array.from(this.componentUrls.values()).includes(url)
  }

  async getAppState(): Promise<AppStateStatus> {
    return AppState.currentState
  }

  async getColorScheme(): Promise<ColorSchemeName> {
    return Appearance.getColorScheme()
  }

  hideMobileInterfaceFromScreenshots(): void {
    hide()
    this.setAndroidScreenshotPrivacy(true)
  }

  stopHidingMobileInterfaceFromScreenshots(): void {
    show()
    this.setAndroidScreenshotPrivacy(false)
  }
}
