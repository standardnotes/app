import AsyncStorage from '@react-native-community/async-storage'
import { AndroidBackHandlerService } from '@Root/AndroidBackHandlerService'
import SNReactNative from '@standardnotes/react-native-utils'
import {
  ApplicationIdentifier,
  Environment,
  LegacyMobileKeychainStructure,
  LegacyRawKeychainValue,
  MobileDeviceInterface,
  NamespacedRootKeyInKeychain,
  Platform as SNPlatform,
  RawKeychainValue,
  removeFromArray,
  TransferPayload,
} from '@standardnotes/snjs'
import { Alert, Linking, PermissionsAndroid, Platform, StatusBar } from 'react-native'
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
import { AppStateObserverService } from './../AppStateObserverService'
import Keychain from './Keychain'
import { SNReactNativeCrypto } from './ReactNativeCrypto'
import { IsMobileWeb } from './Utils'

export type BiometricsType = 'Fingerprint' | 'Face ID' | 'Biometrics' | 'Touch ID'

export enum MobileDeviceEvent {
  RequestsWebViewReload = 0,
}

type MobileDeviceEventHandler = (event: MobileDeviceEvent) => void

/**
 * This identifier was the database name used in Standard Notes web/desktop.
 */
const LEGACY_IDENTIFIER = 'standardnotes'

/**
 * We use this function to decide if we need to prefix the identifier in getDatabaseKeyPrefix or not.
 * It is also used to decide if the raw or the namespaced keychain is used.
 * @param identifier The ApplicationIdentifier
 */
const isLegacyIdentifier = function (identifier: ApplicationIdentifier) {
  return identifier && identifier === LEGACY_IDENTIFIER
}

function isLegacyMobileKeychain(
  x: LegacyMobileKeychainStructure | RawKeychainValue,
): x is LegacyMobileKeychainStructure {
  return x.ak != undefined
}

const showLoadFailForItemIds = (failedItemIds: string[]) => {
  let text =
    'The following items could not be loaded. This may happen if you are in low-memory conditions, or if the note is very large in size. We recommend breaking up large notes into smaller chunks using the desktop or web app.\n\nItems:\n'
  let index = 0
  text += failedItemIds.map((id) => {
    let result = id
    if (index !== failedItemIds.length - 1) {
      result += '\n'
    }
    index++
    return result
  })
  Alert.alert('Unable to load item(s)', text)
}

export class MobileDevice implements MobileDeviceInterface {
  environment: Environment.Mobile = Environment.Mobile
  platform: SNPlatform.Ios | SNPlatform.Android = Platform.OS === 'ios' ? SNPlatform.Ios : SNPlatform.Android
  private eventObservers: MobileDeviceEventHandler[] = []
  public isDarkMode = false
  private crypto: SNReactNativeCrypto

  constructor(
    private stateObserverService?: AppStateObserverService,
    private androidBackHandlerService?: AndroidBackHandlerService,
  ) {
    this.crypto = new SNReactNativeCrypto()
  }

  deinit() {
    this.stateObserverService?.deinit()
    ;(this.stateObserverService as unknown) = undefined
    this.androidBackHandlerService?.deinit()
    ;(this.androidBackHandlerService as unknown) = undefined
  }

  consoleLog(...args: any[]): void {
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

  private getDatabaseKeyPrefix(identifier: ApplicationIdentifier) {
    if (identifier && !isLegacyIdentifier(identifier)) {
      return `${identifier}-Item-`
    } else {
      return 'Item-'
    }
  }

  private keyForPayloadId(id: string, identifier: ApplicationIdentifier) {
    return `${this.getDatabaseKeyPrefix(identifier)}${id}`
  }

  private async getAllDatabaseKeys(identifier: ApplicationIdentifier) {
    const keys = await AsyncStorage.getAllKeys()
    const filtered = keys.filter((key) => {
      return key.startsWith(this.getDatabaseKeyPrefix(identifier))
    })
    return filtered
  }

  getDatabaseKeys(): Promise<string[]> {
    return AsyncStorage.getAllKeys()
  }

  private async getRawStorageKeyValues(keys: string[]) {
    const results: { key: string; value: unknown }[] = []
    if (Platform.OS === 'android') {
      for (const key of keys) {
        try {
          const item = await AsyncStorage.getItem(key)
          if (item) {
            results.push({ key, value: item })
          }
        } catch (e) {
          console.error('Error getting item', key, e)
        }
      }
    } else {
      try {
        for (const item of await AsyncStorage.multiGet(keys)) {
          if (item[1]) {
            results.push({ key: item[0], value: item[1] })
          }
        }
      } catch (e) {
        console.error('Error getting items', e)
      }
    }
    return results
  }

  private async getDatabaseKeyValues(keys: string[]) {
    const results: (TransferPayload | unknown)[] = []

    if (Platform.OS === 'android') {
      const failedItemIds: string[] = []
      for (const key of keys) {
        try {
          const item = await AsyncStorage.getItem(key)
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
    } else {
      try {
        for (const item of await AsyncStorage.multiGet(keys)) {
          if (item[1]) {
            try {
              results.push(JSON.parse(item[1]))
            } catch (e) {
              results.push(item[1])
            }
          }
        }
      } catch (e) {
        console.error('Error getting items', e)
      }
    }
    return results
  }

  async getRawStorageValue(key: string) {
    const item = await AsyncStorage.getItem(key)
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
  }

  stopHidingMobileInterfaceFromScreenshots(): void {
    show()
  }

  async getAllRawStorageKeyValues() {
    const keys = await AsyncStorage.getAllKeys()
    return this.getRawStorageKeyValues(keys)
  }

  setRawStorageValue(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, JSON.stringify(value))
  }

  removeRawStorageValue(key: string): Promise<void> {
    return AsyncStorage.removeItem(key)
  }

  removeAllRawStorageValues(): Promise<void> {
    return AsyncStorage.clear()
  }

  openDatabase(): Promise<{ isNewDatabase?: boolean | undefined } | undefined> {
    return Promise.resolve({ isNewDatabase: false })
  }

  async getAllRawDatabasePayloads<T extends TransferPayload = TransferPayload>(
    identifier: ApplicationIdentifier,
  ): Promise<T[]> {
    const keys = await this.getAllDatabaseKeys(identifier)
    return this.getDatabaseKeyValues(keys) as Promise<T[]>
  }

  saveRawDatabasePayload(payload: TransferPayload, identifier: ApplicationIdentifier): Promise<void> {
    return this.saveRawDatabasePayloads([payload], identifier)
  }

  async saveRawDatabasePayloads(payloads: TransferPayload[], identifier: ApplicationIdentifier): Promise<void> {
    if (payloads.length === 0) {
      return
    }
    await Promise.all(
      payloads.map((item) => {
        return AsyncStorage.setItem(this.keyForPayloadId(item.uuid, identifier), JSON.stringify(item))
      }),
    )
  }

  removeRawDatabasePayloadWithId(id: string, identifier: ApplicationIdentifier): Promise<void> {
    return this.removeRawStorageValue(this.keyForPayloadId(id, identifier))
  }

  async removeAllRawDatabasePayloads(identifier: ApplicationIdentifier): Promise<void> {
    const keys = await this.getAllDatabaseKeys(identifier)
    return AsyncStorage.multiRemove(keys)
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
    if (IsMobileWeb) {
      this.notifyEvent(MobileDeviceEvent.RequestsWebViewReload)
    } else {
      SNReactNative.exitApp()
    }
  }

  addMobileWebEventReceiver(handler: MobileDeviceEventHandler): () => void {
    this.eventObservers.push(handler)

    const thislessObservers = this.eventObservers

    return () => {
      removeFromArray(thislessObservers, handler)
    }
  }

  handleThemeSchemeChange(isDark: boolean): void {
    this.isDarkMode = isDark

    this.reloadStatusBarStyle()
  }

  reloadStatusBarStyle(animated = true) {
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
      void this.deleteFileAtPathIfExists(path)
      const decodedContents = this.crypto.base64Decode(base64.replace(/data.*base64,/, ''))
      await writeFile(path, decodedContents)
      return path
    } catch (error) {
      this.consoleLog(`${error}`)
    }
  }
}
