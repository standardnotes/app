import {
  DeviceInterface,
  getGlobalScope,
  SNApplication,
  ApplicationIdentifier,
} from '@standardnotes/snjs';
import { Database } from '@/database';
import { Bridge } from './services/bridge';

export class WebDeviceInterface extends DeviceInterface {
  private databases: Database[] = [];

  constructor(timeout: any, private bridge: Bridge) {
    super(
      timeout || setTimeout.bind(getGlobalScope()),
      setInterval.bind(getGlobalScope())
    );
  }

  setApplication(application: SNApplication) {
    const database = new Database(
      application.identifier,
      application.alertService
    );
    this.databases.push(database);
  }

  private databaseForIdentifier(identifier: ApplicationIdentifier) {
    return this.databases.find(
      (database) => database.databaseName === identifier
    )!;
  }

  deinit() {
    super.deinit();
    for (const database of this.databases) {
      database.deinit();
    }
    this.databases = [];
  }

  async getRawStorageValue(key: string) {
    return localStorage.getItem(key) as any;
  }

  async getAllRawStorageKeyValues() {
    const results = [];
    for (const key of Object.keys(localStorage)) {
      results.push({
        key: key,
        value: localStorage[key],
      });
    }
    return results;
  }

  async setRawStorageValue(key: string, value: any) {
    localStorage.setItem(key, value);
  }

  async removeRawStorageValue(key: string) {
    localStorage.removeItem(key);
  }

  async removeAllRawStorageValues() {
    localStorage.clear();
  }

  async openDatabase(identifier: ApplicationIdentifier) {
    this.databaseForIdentifier(identifier).unlock();
    return new Promise((resolve, reject) => {
      this.databaseForIdentifier(identifier)
        .openDatabase(() => {
          resolve({ isNewDatabase: true });
        })
        .then(() => {
          resolve({ isNewDatabase: false });
        })
        .catch((error) => {
          reject(error);
        });
    }) as Promise<{ isNewDatabase?: boolean } | undefined>;
  }

  async getAllRawDatabasePayloads(identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).getAllPayloads();
  }

  async saveRawDatabasePayload(
    payload: any,
    identifier: ApplicationIdentifier
  ) {
    return this.databaseForIdentifier(identifier).savePayload(payload);
  }

  async saveRawDatabasePayloads(
    payloads: any[],
    identifier: ApplicationIdentifier
  ) {
    return this.databaseForIdentifier(identifier).savePayloads(payloads);
  }

  async removeRawDatabasePayloadWithId(
    id: string,
    identifier: ApplicationIdentifier
  ) {
    return this.databaseForIdentifier(identifier).deletePayload(id);
  }

  async removeAllRawDatabasePayloads(identifier: ApplicationIdentifier) {
    return this.databaseForIdentifier(identifier).clearAllPayloads();
  }

  async getNamespacedKeychainValue(identifier: ApplicationIdentifier) {
    const keychain = await this.getRawKeychainValue();
    if (!keychain) {
      return;
    }
    return keychain[identifier];
  }

  async setNamespacedKeychainValue(
    value: any,
    identifier: ApplicationIdentifier
  ) {
    let keychain = await this.getRawKeychainValue();
    if (!keychain) {
      keychain = {};
    }
    return this.bridge.setKeychainValue({
      ...keychain,
      [identifier]: value,
    });
  }

  async clearNamespacedKeychainValue(identifier: ApplicationIdentifier) {
    const keychain = await this.getRawKeychainValue();
    if (!keychain) {
      return;
    }
    delete keychain[identifier];
    return this.bridge.setKeychainValue(keychain);
  }

  getRawKeychainValue(): Promise<any> {
    return this.bridge.getKeychainValue();
  }

  legacy_setRawKeychainValue(value: unknown): Promise<any> {
    return this.bridge.setKeychainValue(value);
  }

  clearRawKeychainValue() {
    return this.bridge.clearKeychainValue();
  }

  openUrl(url: string) {
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }
}
