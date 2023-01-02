import SNReactNative from '@standardnotes/react-native-utils'
import { AppleIAPReceipt } from '@standardnotes/services'
import {
  AppleIAPProductId,
  ApplicationIdentifier,
  Environment,
  LegacyRawKeychainValue,
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
import { MMKV } from 'react-native-mmkv'
import { hide, show } from 'react-native-privacy-snapshot'
import Share from 'react-native-share'
import { AndroidBackHandlerService } from '../AndroidBackHandlerService'
import { PurchaseManager } from '../PurchaseManager'
import { AppStateObserverService } from './../AppStateObserverService'
import { isLegacyMobileKeychain } from './Database/isLegacyMobileKeychain'
import { isLegacyIdentifier } from './Database/LEGACY_IDENTIFIER'
import { showLoadFailForItemIds } from './Database/showLoadFailForItemIds'
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
  private databases: Record<ApplicationIdentifier, MMKV> = {}

  constructor(
    private stateObserverService?: AppStateObserverService,
    private androidBackHandlerService?: AndroidBackHandlerService,
    private colorSchemeService?: ColorSchemeObserverService,
  ) {}

  /** Non-application specific DB that stores global RawStorageKey values */
  private getSharedGlobalDb() {
    return this.findOrCreateDatabase('rawStorage')
  }

  purchaseSubscriptionIAP(plan: AppleIAPProductId): Promise<AppleIAPReceipt | undefined> {
    return PurchaseManager.getInstance().purchase(plan)
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

  async setLegacyRawKeychainValue(value: LegacyRawKeychainValue): Promise<void> {
    await Keychain.setKeys(value)
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

  private findOrCreateDatabase(identifier: ApplicationIdentifier): MMKV {
    const existing = this.databases[identifier]
    if (existing) {
      return existing
    }
    const newDb = new MMKV({ id: identifier })
    this.databases[identifier] = newDb
    return newDb
  }

  private getDatabaseKeyPrefix() {
    return 'Item-'
  }

  private keyForPayloadId(id: string) {
    return `${this.getDatabaseKeyPrefix()}${id}`
  }

  async getDatabaseKeys(identifier: string): Promise<string[]> {
    const db = this.findOrCreateDatabase(identifier)
    const keys = db.getAllKeys()
    const filtered = keys.filter((key) => {
      return key.startsWith(this.getDatabaseKeyPrefix())
    })
    return filtered
  }

  private async getDatabaseKeyValues(identifier: string, keys: string[]) {
    const db = this.findOrCreateDatabase(identifier)

    const results: (TransferPayload | unknown)[] = []

    const failedItemIds: string[] = []
    for (const key of keys) {
      try {
        const item = db.getString(key)
        if (item) {
          try {
            results.push(JSON.parse(item) as TransferPayload)
          } catch (e) {
            results.push(item)
          }
        }
      } catch (e) {
        console.error('Error getting item', key, e)
        failedItemIds.push(key)
      }
    }
    if (failedItemIds.length > 0) {
      showLoadFailForItemIds(failedItemIds)
    }

    return results
  }

  async getRawStorageValue(key: string) {
    const item = this.getSharedGlobalDb().getString(key)
    if (item) {
      try {
        return JSON.parse(item)
      } catch (e) {
        return item
      }
    }
  }

  hideMobileInterfaceFromScreenshots(): void {
    hide()
    this.setAndroidScreenshotPrivacy(true)
  }

  stopHidingMobileInterfaceFromScreenshots(): void {
    show()
    this.setAndroidScreenshotPrivacy(false)
  }

  async getAllRawStorageKeyValues() {
    const keys = this.getSharedGlobalDb().getAllKeys()

    const db = this.getSharedGlobalDb()

    const results: { key: string; value: unknown }[] = []

    for (const key of keys) {
      try {
        const item = db.getString(key)
        if (item) {
          results.push({ key, value: item })
        }
      } catch (e) {
        console.error('Error getting item', key, e)
      }
    }

    return results
  }

  async setRawStorageValue(key: string, value: string) {
    this.getSharedGlobalDb().set(key, JSON.stringify(value))
  }

  async removeRawStorageValue(key: string) {
    return this.getSharedGlobalDb().delete(key)
  }

  async removeAllRawStorageValues() {
    return this.getSharedGlobalDb().clearAll()
  }

  openDatabase(): Promise<{ isNewDatabase?: boolean | undefined } | undefined> {
    return Promise.resolve({ isNewDatabase: false })
  }

  async getAllRawDatabasePayloads<T extends TransferPayload = TransferPayload>(
    identifier: ApplicationIdentifier,
  ): Promise<T[]> {
    const keys = await this.getDatabaseKeys(identifier)
    return this.getDatabaseKeyValues(identifier, keys) as Promise<T[]>
  }

  async getRawDatabasePayloadsForKeys<T extends TransferPayload = TransferPayload>(
    identifier: ApplicationIdentifier,
    keys: string[],
  ): Promise<T[]> {
    return this.getDatabaseKeyValues(identifier, keys) as Promise<T[]>
  }

  saveRawDatabasePayload(payload: TransferPayload, identifier: ApplicationIdentifier): Promise<void> {
    return this.saveRawDatabasePayloads([payload], identifier)
  }

  async saveRawDatabasePayloads(payloads: TransferPayload[], identifier: ApplicationIdentifier): Promise<void> {
    if (payloads.length === 0) {
      return
    }

    const db = this.findOrCreateDatabase(identifier)
    for (const payload of payloads) {
      db.set(this.keyForPayloadId(payload.uuid), JSON.stringify(payload))
    }
  }

  async removeRawDatabasePayloadWithId(id: string, identifier: ApplicationIdentifier) {
    const db = this.findOrCreateDatabase(identifier)
    db.delete(this.keyForPayloadId(id))
  }

  async removeAllRawDatabasePayloads(identifier: ApplicationIdentifier): Promise<void> {
    const keys = await this.getDatabaseKeys(identifier)
    for (const key of keys) {
      await this.removeRawDatabasePayloadWithId(key, identifier)
    }
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

    if (!keychain[identifier] && isLegacyIdentifier(identifier) && isLegacyMobileKeychain(keychain)) {
      await this.clearRawKeychainValue()
      return
    }

    delete keychain[identifier]
    await Keychain.setKeys(keychain)
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
}
