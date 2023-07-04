import { RawKeychainValue } from '@standardnotes/models'
import { WebDevice } from '@standardnotes/web/src/javascripts/Application/Device/WebDevice'
import { storage } from 'webextension-polyfill'

const KEYCHAIN_STORAGE_KEY = 'keychain'

export class ExtensionDevice extends WebDevice {
  override async getKeychainValue(): Promise<RawKeychainValue> {
    const value = (await storage.local.get(KEYCHAIN_STORAGE_KEY))[KEYCHAIN_STORAGE_KEY]
    console.log('getKeychainValue', value)

    if (value) {
      return JSON.parse(value)
    }

    return {}
  }

  override async setKeychainValue(value: RawKeychainValue): Promise<void> {
    return storage.local.set({ [KEYCHAIN_STORAGE_KEY]: JSON.stringify(value) })
  }

  override async clearRawKeychainValue(): Promise<void> {
    return storage.local.remove(KEYCHAIN_STORAGE_KEY)
  }

  override async getRawStorageValue(key: string): Promise<string | undefined> {
    const result = (await storage.local.get(key))[key]
    console.log('getRawStorageValue', key, result)

    if (result == undefined) {
      return undefined
    }

    return result
  }

  override async setRawStorageValue(key: string, value: string) {
    return storage.local.set({ [key]: value })
  }

  override async removeRawStorageValue(key: string) {
    return storage.local.remove(key)
  }

  override async removeAllRawStorageValues() {
    return storage.local.clear()
  }
}
