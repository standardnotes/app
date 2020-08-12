/** Platform-specific (i-e desktop/web) behavior is handled by a Platform object. */
export interface Platform {
  getKeychainValue(): Promise<unknown>;
  setKeychainValue(value: any): Promise<void>;
  clearKeychainValue(): Promise<void>;
}

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class WebPlatform implements Platform {
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