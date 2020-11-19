import { Bridge } from "./bridge";
import { Environment } from '@standardnotes/snjs';

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class BrowserBridge implements Bridge {
  constructor(public appVersion: string) {}
  environment = Environment.Web;

  async getKeychainValue(): Promise<unknown> {
    const value = localStorage.getItem(KEYCHAIN_STORAGE_KEY);
    if (value) {
      return JSON.parse(value);
    }
  }

  async setKeychainValue(value: any): Promise<void> {
    localStorage.setItem(KEYCHAIN_STORAGE_KEY, JSON.stringify(value));
  }

  async clearKeychainValue(): Promise<void> {
    localStorage.removeItem(KEYCHAIN_STORAGE_KEY);
  }

  /** No-ops */

  syncComponents() {}
  onMajorDataChange() {}
  onInitialDataLoad() {}
  onSearch() {}
  downloadBackup() {}
}
