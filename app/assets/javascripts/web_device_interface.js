import { DeviceInterface, getGlobalScope } from 'snjs';
import { Database } from '@/database';

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class WebDeviceInterface extends DeviceInterface {

  constructor({
    namespace,
    timeout
  } = {}) {
    super({
      namespace,
      timeout: timeout || setTimeout.bind(getGlobalScope()),
      interval: setInterval.bind(getGlobalScope())
    });
    this.createDatabase();
  }

  createDatabase() {
    this.database = new Database();
  }

  setApplication(application) {
    this.database.setApplication(application);
  }

  /** @override */
  deinit() {
    super.deinit();
    this.database.deinit();
  }

  /**
  * @value storage
  */

  async getRawStorageValue(key) {
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

  async setRawStorageValue(key, value) {
    localStorage.setItem(key, value);
  }

  async removeRawStorageValue(key) {
    localStorage.removeItem(key);
  }

  async removeAllRawStorageValues() {
    localStorage.clear();
  }

  async openDatabase() {
    this.database.unlock();
    return new Promise((resolve) => {
      this.database.openDatabase(() => {
        resolve({ isNewDatabase: true });
      }).then(() => {
        resolve({ isNewDatabase: false });
      });
    });
  }

  /** @private */
  getDatabaseKeyPrefix() {
    if (this.namespace) {
      return `${this.namespace}-item-`;
    } else {
      return `item-`;
    }
  }

  /** @private */
  keyForPayloadId(id) {
    return `${this.getDatabaseKeyPrefix()}${id}`;
  }

  async getAllRawDatabasePayloads() {
    return this.database.getAllPayloads();
  }

  async saveRawDatabasePayload(payload) {
    return this.database.savePayload(payload);
  }

  async saveRawDatabasePayloads(payloads) {
    return this.database.savePayloads(payloads);
  }

  async removeRawDatabasePayloadWithId(id) {
    return this.database.deletePayload(id);
  }

  async removeAllRawDatabasePayloads() {
    return this.database.clearAllPayloads();
  }

  /** @keychian */
  async getKeychainValue() {
    const value = localStorage.getItem(KEYCHAIN_STORAGE_KEY);
    if (value) {
      return JSON.parse(value);
    }
  }

  async setKeychainValue(value) {
    localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(value));
  }

  async clearKeychainValue() {
    localStorage.removeItem(KEYCHAIN_STORAGE_KEY);
  }

  /**
   * @actions
   */
  openUrl(url) {
    const win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  }

}
