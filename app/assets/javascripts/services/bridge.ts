/** Platform-specific (i-e Electron/browser) behavior is handled by a Bridge object. */
export interface Bridge {
  getKeychainValue(): Promise<any>;
  setKeychainValue(value: any): Promise<void>;
  clearKeychainValue(): Promise<void>;
}

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class BrowserBridge implements Bridge {

  async getKeychainValue(): Promise<any> {
    const value = localStorage.getItem(this.keychainStorageKey);
    if (value) {
      return JSON.parse(value);
    }
  }

  async setKeychainValue(value: any): Promise<void> {
    localStorage.setItem(this.keychainStorageKey, JSON.stringify(value));
  }

  async clearKeychainValue(): Promise<void> {
    localStorage.removeItem(this.keychainStorageKey);
  }

  get keychainStorageKey() {
    return KEYCHAIN_STORAGE_KEY;
  }
}
