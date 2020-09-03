/** Platform-specific (i-e Electron/browser) behavior is handled by a Bridge object. */
export interface Bridge {
  getKeychainValue(): Promise<unknown>;
  setKeychainValue(value: any): Promise<void>;
  clearKeychainValue(): Promise<void>;
}

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class BrowserBridge implements Bridge {

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
}
