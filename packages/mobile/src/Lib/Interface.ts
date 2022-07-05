import AsyncStorage from '@react-native-community/async-storage'
import SNReactNative from '@standardnotes/react-native-utils'
import {
  ApplicationIdentifier,
  DeviceInterface,
  Environment,
  LegacyMobileKeychainStructure,
  LegacyRawKeychainValue,
  NamespacedRootKeyInKeychain,
  RawKeychainValue,
  TransferPayload,
} from '@standardnotes/snjs'
import { Alert, Linking, Platform } from 'react-native'
import FingerprintScanner from 'react-native-fingerprint-scanner'
import Keychain from './Keychain'

export type BiometricsType = 'Fingerprint' | 'Face ID' | 'Biometrics' | 'Touch ID'

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

export class MobileDeviceInterface implements DeviceInterface {
  environment: Environment.Mobile = Environment.Mobile

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  deinit() {}

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
    console.log('in mobile getAllRawDatabasePayloads...')
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

  getRawKeychainValue(): Promise<RawKeychainValue | null | undefined> {
    return Keychain.getKeys()
  }

  async clearRawKeychainValue(): Promise<void> {
    await Keychain.clearKeys()
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
    SNReactNative.exitApp()
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  performHardReset() {}

  isDeviceDestroyed() {
    return false
  }
}
