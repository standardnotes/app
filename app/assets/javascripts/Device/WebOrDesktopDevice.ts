import {
  SNApplication,
  ApplicationIdentifier,
  Environment,
  LegacyRawKeychainValue,
  RawKeychainValue,
  TransferPayload,
  NamespacedRootKeyInKeychain,
  extendArray,
  WebOrDesktopDeviceInterface,
} from '@standardnotes/snjs'
import { Database } from '../Database'

export abstract class WebOrDesktopDevice implements WebOrDesktopDeviceInterface {
  constructor(public appVersion: string) {}

  private databases: Database[] = []

  abstract environment: Environment

  setApplication(application: SNApplication): void {
    const database = new Database(application.identifier, application.alertService)

    this.databases.push(database)
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

  private databaseForIdentifier(identifier: ApplicationIdentifier) {
    return this.databases.find((database) => database.databaseName === identifier) as Database
  }

  async clearAllDataFromDevice(): Promise<void> {
    await this.clearRawKeychainValue()
    await this.removeAllRawStorageValues()
    await Database.deleteAll()
  }

  deinit() {
    for (const database of this.databases) {
      database.deinit()
    }
    this.databases = []
  }

  async getRawStorageValue(key: string): Promise<string | undefined> {
    const result = localStorage.getItem(key)

    if (result == undefined) {
      return undefined
    }

    return result
  }

  async getAllRawStorageKeyValues() {
    const results = []
    for (const key of Object.keys(localStorage)) {
      results.push({
        key: key,
        value: localStorage[key],
      })
    }
    return results
  }

  async setRawStorageValue(key: string, value: string) {
    localStorage.setItem(key, value)
  }

  async removeRawStorageValue(key: string) {
    localStorage.removeItem(key)
  }

  async removeAllRawStorageValues() {
    localStorage.clear()
  }

  async openDatabase(identifier: ApplicationIdentifier) {
    this.databaseForIdentifier(identifier).unlock()
    return new Promise((resolve, reject) => {
      this.databaseForIdentifier(identifier)
        .openDatabase(() => {
          resolve({ isNewDatabase: true })
        })
        .then(() => {
          resolve({ isNewDatabase: false })
        })
        .catch((error) => {
          reject(error)
        })
    }) as Promise<{ isNewDatabase?: boolean } | undefined>
  }

  async getAllRawDatabasePayloads(identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).getAllPayloads()
  }

  async saveRawDatabasePayload(payload: TransferPayload, identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).savePayload(payload)
  }

  async saveRawDatabasePayloads(payloads: TransferPayload[], identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).savePayloads(payloads)
  }

  async removeRawDatabasePayloadWithId(id: string, identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).deletePayload(id)
  }

  async removeAllRawDatabasePayloads(identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).clearAllPayloads()
  }

  async getNamespacedKeychainValue(identifier: ApplicationIdentifier) {
    const keychain = await this.getKeychainValue()

    if (!keychain) {
      return
    }

    return keychain[identifier]
  }

  async getDatabaseKeys(): Promise<string[]> {
    const keys: string[] = []

    for (const database of this.databases) {
      extendArray(keys, await database.getAllKeys())
    }

    return keys
  }

  async setNamespacedKeychainValue(value: NamespacedRootKeyInKeychain, identifier: ApplicationIdentifier) {
    let keychain = await this.getKeychainValue()

    if (!keychain) {
      keychain = {}
    }

    return this.setKeychainValue({
      ...keychain,
      [identifier]: value,
    })
  }

  async clearNamespacedKeychainValue(identifier: ApplicationIdentifier) {
    const keychain = await this.getKeychainValue()
    if (!keychain) {
      return
    }

    delete keychain[identifier]

    return this.setKeychainValue(keychain)
  }

  setRawKeychainValue(value: unknown): Promise<void> {
    return this.setKeychainValue(value)
  }

  openUrl(url: string) {
    const win = window.open(url, '_blank')
    if (win) {
      win.focus()
    }
  }

  setLegacyRawKeychainValue(value: LegacyRawKeychainValue): Promise<void> {
    return this.setKeychainValue(value)
  }

  abstract getKeychainValue(): Promise<RawKeychainValue>

  abstract setKeychainValue(value: unknown): Promise<void>

  abstract clearRawKeychainValue(): Promise<void>

  abstract isDeviceDestroyed(): boolean

  abstract performHardReset(): Promise<void>

  async performSoftReset(): Promise<void> {
    window.location.reload()
  }
}
