import { DeviceInterface, getGlobalScope, SNApplication } from 'snjs';
import { Database } from '@/database';
import { Bridge } from './services/bridge';

export class WebDeviceInterface extends DeviceInterface {

  private database: Database

  constructor(
    namespace: string,
    timeout: any,
    private bridge: Bridge
  ) {
    super(
      namespace,
      timeout || setTimeout.bind(getGlobalScope()),
      setInterval.bind(getGlobalScope())
    );
    this.database = new Database();
  }

  setApplication(application: SNApplication) {
    this.database.setAlertService(application.alertService!);
  }

  deinit() {
    super.deinit();
    this.database.deinit();
  }

  async getRawStorageValue(key: string) {
    return localStorage.getItem(key);
  }

  async getAllRawStorageKeyValues() {
    const results = [];
    for (const key of Object.keys(localStorage)) {
      results.push({
        key: key,
        value: localStorage[key]
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

  async openDatabase() {
    this.database.unlock();
    return new Promise((resolve, reject) => {
      this.database.openDatabase(() => {
        resolve({ isNewDatabase: true });
      }).then(() => {
        resolve({ isNewDatabase: false });
      }).catch((error => {
        reject(error);
      }));
    }) as Promise<{ isNewDatabase?: boolean } | undefined>;
  }

  private getDatabaseKeyPrefix() {
    if (this.namespace) {
      return `${this.namespace}-item-`;
    } else {
      return `item-`;
    }
  }

  private keyForPayloadId(id: string) {
    return `${this.getDatabaseKeyPrefix()}${id}`;
  }

  async getAllRawDatabasePayloads() {
    return this.database.getAllPayloads();
  }

  async saveRawDatabasePayload(payload: any) {
    return this.database.savePayload(payload);
  }

  async saveRawDatabasePayloads(payloads: any[]) {
    return this.database.savePayloads(payloads);
  }

  async removeRawDatabasePayloadWithId(id: string) {
    return this.database.deletePayload(id);
  }

  async removeAllRawDatabasePayloads() {
    return this.database.clearAllPayloads();
  }

  getKeychainValue(): Promise<unknown> {
    return this.bridge.getKeychainValue();
  }

  setKeychainValue(value: any) {
    return this.bridge.setKeychainValue(value);
  }

  clearKeychainValue() {
    return this.bridge.clearKeychainValue();
  }

  openUrl(url: string) {
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }
}
