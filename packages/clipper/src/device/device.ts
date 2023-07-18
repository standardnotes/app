import { RawKeychainValue } from '@standardnotes/snjs'
import { WebDevice } from '@standardnotes/web/src/javascripts/Application/Device/WebDevice'
import { storage } from 'webextension-polyfill'

const KEYCHAIN_STORAGE_KEY = 'keychain'

export class ExtensionDevice extends WebDevice {
  async getKeychainValue(): Promise<RawKeychainValue> {
    const value = (await storage.local.get(KEYCHAIN_STORAGE_KEY))[KEYCHAIN_STORAGE_KEY]

    if (value) {
      return JSON.parse(value)
    }

    return {}
  }

  async setKeychainValue(value: RawKeychainValue): Promise<void> {
    return storage.local.set({ [KEYCHAIN_STORAGE_KEY]: JSON.stringify(value) })
  }

  async clearRawKeychainValue(): Promise<void> {
    return storage.local.remove(KEYCHAIN_STORAGE_KEY)
  }

  async getRawStorageValue(key: string): Promise<string | undefined> {
    const result = (await storage.local.get(key))[key]

    if (result == undefined) {
      return undefined
    }

    return result
  }

  async setRawStorageValue(key: string, value: string) {
    return storage.local.set({ [key]: value })
  }

  async removeRawStorageValue(key: string) {
    return storage.local.remove(key)
  }

  async removeAllRawStorageValues() {
    return storage.local.clear()
  }
}
