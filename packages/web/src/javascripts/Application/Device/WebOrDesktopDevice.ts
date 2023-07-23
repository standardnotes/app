import {
  SNApplication,
  ApplicationIdentifier,
  Environment,
  RawKeychainValue,
  TransferPayload,
  NamespacedRootKeyInKeychain,
  WebOrDesktopDeviceInterface,
  Platform,
  FullyFormedTransferPayload,
  DatabaseLoadOptions,
  GetSortedPayloadsByPriority,
  DatabaseFullEntryLoadChunk,
  DatabaseFullEntryLoadChunkResponse,
  ApplicationInterface,
  namespacedKey,
  RawStorageKey,
} from '@standardnotes/snjs'
import { Database } from '../Database'

export abstract class WebOrDesktopDevice implements WebOrDesktopDeviceInterface {
  platform?: Platform

  constructor(public appVersion: string) {}

  private databases: Database[] = []

  abstract environment: Environment

  setApplication(application: SNApplication): void {
    const database = new Database(application.identifier, application.alerts)

    this.databases.push(database)
  }

  removeApplication(application: ApplicationInterface): void {
    const database = this.databaseForIdentifier(application.identifier)

    if (database) {
      database.deinit()
      this.databases = this.databases.filter((db) => db !== database)
    }
  }

  deinit() {
    for (const database of this.databases) {
      database.deinit()
    }

    this.databases = []
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

  async clearAllDataFromDevice(workspaceIdentifiers: ApplicationIdentifier[]): Promise<{ killsApplication: boolean }> {
    await this.clearRawKeychainValue()

    await this.removeAllRawStorageValues()

    await Database.deleteAll(workspaceIdentifiers)

    return { killsApplication: false }
  }

  async getRawStorageValue(key: string): Promise<string | undefined> {
    const result = localStorage.getItem(key)

    if (result == undefined) {
      return undefined
    }

    return result
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

  async removeRawStorageValuesForIdentifier(identifier: ApplicationIdentifier) {
    await this.removeRawStorageValue(namespacedKey(identifier, RawStorageKey.SnjsVersion))
    await this.removeRawStorageValue(namespacedKey(identifier, RawStorageKey.StorageObject))
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

  async getDatabaseLoadChunks(
    options: DatabaseLoadOptions,
    identifier: string,
  ): Promise<DatabaseFullEntryLoadChunkResponse> {
    const entries = await this.getAllDatabaseEntries(identifier)

    const {
      itemsKeyPayloads,
      keySystemRootKeyPayloads,
      keySystemItemsKeyPayloads,
      contentTypePriorityPayloads,
      remainingPayloads,
    } = GetSortedPayloadsByPriority(entries, options)

    const itemsKeysChunk: DatabaseFullEntryLoadChunk = {
      entries: itemsKeyPayloads,
    }

    const keySystemRootKeysChunk: DatabaseFullEntryLoadChunk = {
      entries: keySystemRootKeyPayloads,
    }

    const keySystemItemsKeysChunk: DatabaseFullEntryLoadChunk = {
      entries: keySystemItemsKeyPayloads,
    }

    const contentTypePriorityChunk: DatabaseFullEntryLoadChunk = {
      entries: contentTypePriorityPayloads,
    }

    const remainingPayloadsChunks: DatabaseFullEntryLoadChunk[] = []
    for (let i = 0; i < remainingPayloads.length; i += options.batchSize) {
      remainingPayloadsChunks.push({
        entries: remainingPayloads.slice(i, i + options.batchSize),
      })
    }

    const result: DatabaseFullEntryLoadChunkResponse = {
      fullEntries: {
        itemsKeys: itemsKeysChunk,
        keySystemRootKeys: keySystemRootKeysChunk,
        keySystemItemsKeys: keySystemItemsKeysChunk,
        remainingChunks: [contentTypePriorityChunk, ...remainingPayloadsChunks],
      },
      remainingChunksItemCount: contentTypePriorityPayloads.length + remainingPayloads.length,
    }

    return result
  }

  async getAllDatabaseEntries(identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).getAllPayloads()
  }

  getDatabaseEntries<T extends FullyFormedTransferPayload = FullyFormedTransferPayload>(
    identifier: string,
    keys: string[],
  ): Promise<T[]> {
    return this.databaseForIdentifier(identifier).getPayloadsForKeys(keys)
  }

  async saveDatabaseEntry(payload: TransferPayload, identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).savePayload(payload)
  }

  async saveDatabaseEntries(payloads: TransferPayload[], identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).savePayloads(payloads)
  }

  async removeDatabaseEntry(id: string, identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).deletePayload(id)
  }

  async removeAllDatabaseEntries(identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).clearAllPayloads()
  }

  async getNamespacedKeychainValue(identifier: ApplicationIdentifier) {
    const keychain = await this.getKeychainValue()

    if (!keychain) {
      return
    }

    return keychain[identifier]
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

  abstract getKeychainValue(): Promise<RawKeychainValue>

  abstract setKeychainValue(value: unknown): Promise<void>

  abstract clearRawKeychainValue(): Promise<void>

  abstract isDeviceDestroyed(): boolean

  abstract performHardReset(): Promise<void>

  async performSoftReset(): Promise<void> {
    window.location.reload()
  }
}
