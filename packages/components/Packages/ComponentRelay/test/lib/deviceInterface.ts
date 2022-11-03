import { DeviceInterface as SNDeviceInterface } from '@standardnotes/snjs';
import { LocalStorage } from './localStorage';

const KEYCHAIN_STORAGE_KEY = 'keychain';

/**
 * The DeviceInterface implementation to handle storage and keychain operations.
 */
export default class DeviceInterface extends SNDeviceInterface {
  private storage = {};
  private localStorage: LocalStorage;

  constructor(timeout: any, interval: any) {
    super(timeout, interval);
    this.localStorage = new LocalStorage(this.storage);
  }

  async getRawStorageValue(key) {
    return this.localStorage.getItem(key);
  }

  async getAllRawStorageKeyValues() {
    const results = [];
    for (const key of Object.keys(this.storage)) {
      results.push({
        key: key,
        value: this.storage[key]
      });
    }
    return results;
  }

  async setRawStorageValue(key, value) {
    this.localStorage.setItem(key, value);
  }

  async removeRawStorageValue(key) {
    this.localStorage.removeItem(key);
  }

  async removeAllRawStorageValues() {
    this.localStorage.clear();
  }

  async openDatabase(_identifier) {
    return {};
  }

  getDatabaseKeyPrefix(identifier) {
    if (identifier) {
      return `${identifier}-item-`;
    } else {
      return 'item-';
    }
  }

  keyForPayloadId(id, identifier) {
    return `${this.getDatabaseKeyPrefix(identifier)}${id}`;
  }

  async getAllRawDatabasePayloads(identifier) {
    const models = [];
    for (const key in this.storage) {
      if (key.startsWith(this.getDatabaseKeyPrefix(identifier))) {
        models.push(JSON.parse(this.storage[key]));
      }
    }
    return models;
  }

  async saveRawDatabasePayload(payload, identifier) {
    this.localStorage.setItem(
      this.keyForPayloadId(payload.uuid, identifier),
      JSON.stringify(payload)
    );
  }

  async saveRawDatabasePayloads(payloads, identifier) {
    for (const payload of payloads) {
      await this.saveRawDatabasePayload(payload, identifier);
    }
  }

  async removeRawDatabasePayloadWithId(id, identifier) {
    this.localStorage.removeItem(this.keyForPayloadId(id, identifier));
  }

  async removeAllRawDatabasePayloads(identifier) {
    for (const key in this.storage) {
      if (key.startsWith(this.getDatabaseKeyPrefix(identifier))) {
        delete this.storage[key];
      }
    }
  }

  async getNamespacedKeychainValue(identifier) {
    const keychain = await this.getRawKeychainValue();
    if (!keychain) {
      return;
    }
    return keychain[identifier];
  }

  async setNamespacedKeychainValue(value, identifier) {
    let keychain = await this.getRawKeychainValue();
    if (!keychain) {
      keychain = {};
    }
    this.localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify({
      ...keychain,
      [identifier]: value,
    }));
  }

  async clearNamespacedKeychainValue(identifier) {
    const keychain = await this.getRawKeychainValue();
    if (!keychain) {
      return;
    }
    delete keychain[identifier];
    this.localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(keychain));
  }

  /** Allows unit tests to set legacy keychain structure as it was <= 003 */
  async legacy_setRawKeychainValue(value) {
    this.localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(value));
  }

  async getRawKeychainValue() {
    const keychain = this.localStorage.getItem(KEYCHAIN_STORAGE_KEY);
    return JSON.parse(keychain);
  }

  async clearRawKeychainValue() {
    this.localStorage.removeItem(KEYCHAIN_STORAGE_KEY);
  }

  async openUrl(url) {
    window.open(url);
  }
}
