import { PurePayload, Environment } from "snjs";

/** Platform-specific (i-e Electron/browser) behavior is handled by a Bridge object. */
export interface Bridge {
  environment: Environment,

  getKeychainValue(): Promise<unknown>;
  setKeychainValue(value: any): Promise<void>;
  clearKeychainValue(): Promise<void>;

  extensionsServerHost?: string;
  syncComponents(payloads: PurePayload[]): void;
  onMajorDataChange(): void;
  onInitialDataLoad(): void;
  onSearch(text?: string): void;
  downloadBackup(): void;
}

const KEYCHAIN_STORAGE_KEY = 'keychain';

export class BrowserBridge implements Bridge {
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

  syncComponents() {
  }
  onMajorDataChange() {
  }
  onInitialDataLoad() {
  }
  onSearch() {
  }
  downloadBackup() {
  }
}
