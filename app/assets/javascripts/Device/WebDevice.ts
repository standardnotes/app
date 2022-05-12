import { Environment, RawKeychainValue } from '@standardnotes/snjs'
import { WebOrDesktopDevice } from './WebOrDesktopDevice'

const KEYCHAIN_STORAGE_KEY = 'keychain'

export class WebDevice extends WebOrDesktopDevice {
  environment = Environment.Web

  async getKeychainValue(): Promise<RawKeychainValue> {
    const value = localStorage.getItem(KEYCHAIN_STORAGE_KEY)

    if (value) {
      return JSON.parse(value)
    }

    return {}
  }

  async setKeychainValue(value: RawKeychainValue): Promise<void> {
    localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(value))
  }

  async clearRawKeychainValue(): Promise<void> {
    localStorage.removeItem(KEYCHAIN_STORAGE_KEY)
  }
}
