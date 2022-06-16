import { Environment, RawKeychainValue } from '@standardnotes/snjs'
import { WebOrDesktopDevice } from './WebOrDesktopDevice'

const KEYCHAIN_STORAGE_KEY = 'keychain'
const DESTROYED_DEVICE_URL_PARAM = 'destroyed'
const DESTROYED_DEVICE_URL_VALUE = 'true'

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

  async performHardReset(): Promise<void> {
    const url = new URL(window.location.href)
    const params = url.searchParams
    params.append(DESTROYED_DEVICE_URL_PARAM, DESTROYED_DEVICE_URL_VALUE)
    window.location.replace(url.href)
  }

  public isDeviceDestroyed(): boolean {
    const url = new URL(window.location.href)
    const params = url.searchParams
    return params.get(DESTROYED_DEVICE_URL_PARAM) === DESTROYED_DEVICE_URL_VALUE
  }
}
